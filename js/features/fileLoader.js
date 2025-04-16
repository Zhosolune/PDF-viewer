/**
 * 文件加载模块
 * 处理PDF文件的选择和拖放功能
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPDFManager from '../core/pdfManager.js';

class FileLoader {
    /**
     * 创建文件加载模块实例
     */
    constructor() {
        this._acceptedFileTypes = ['application/pdf'];
        this._maxFileSizeMB = 100; // 最大文件大小（MB）
        
        // 初始化事件监听
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 添加文件选择按钮事件监听
        const selectFileBtn = document.getElementById('select-file-btn');
        const fileInput = document.getElementById('file-input');
        
        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', this._onFileSelected.bind(this));
        }
        
        // 设置拖放区域
        this._setupDragAndDrop();
    }

    /**
     * 处理文件选择事件
     * @private
     * @param {Event} event - 文件选择事件
     */
    _onFileSelected(event) {
        const fileInput = event.target;
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        this._loadFile(file);
        
        // 重置文件输入框，允许选择相同的文件
        fileInput.value = '';
    }

    /**
     * 设置拖放区域功能
     * @private
     */
    _setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const pdfContainer = document.getElementById('pdf-container');
        
        if (!dropZone || !pdfContainer) return;
        
        // 辅助函数，检查元素是否是另一个元素的子元素
        const isChild = (child, parent) => {
            let node = child;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        };
        
        // 阻止默认行为
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        // 高亮拖放区域
        const highlight = () => {
            dropZone.classList.add('drag-over');
        };
        
        // 取消高亮拖放区域
        const unhighlight = () => {
            dropZone.classList.remove('drag-over');
        };
        
        // 处理拖放的文件
        const handleFiles = (files) => {
            if (files.length === 0) return;
            
            // 只处理第一个文件
            const file = files[0];
            this._loadFile(file);
        };
        
        // 点击拖放区域也触发文件选择
        dropZone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // 设置拖放相关事件
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pdfContainer.addEventListener(eventName, preventDefaults, false);
        });
        
        // 处理拖入事件（高亮拖放区域）
        pdfContainer.addEventListener('dragenter', (e) => {
            if (!isChild(e.target, dropZone)) {
                highlight();
            }
        }, false);
        
        // 处理拖离事件（取消高亮）
        pdfContainer.addEventListener('dragleave', (e) => {
            if (!isChild(e.relatedTarget, pdfContainer)) {
                unhighlight();
            }
        }, false);
        
        // 处理拖放事件（加载文件）
        pdfContainer.addEventListener('drop', (e) => {
            unhighlight();
            handleFiles(e.dataTransfer.files);
        }, false);
    }

    /**
     * 加载PDF文件
     * @private
     * @param {File} file - PDF文件对象
     * @returns {Promise<boolean>} - 加载是否成功
     */
    async _loadFile(file) {
        // 检查文件类型
        if (!this._acceptedFileTypes.includes(file.type)) {
            gUI.showMessage('请选择PDF文件', 'error');
            return false;
        }
        
        // 检查文件大小
        if (file.size > this._maxFileSizeMB * 1024 * 1024) {
            gUI.showMessage(`文件过大，最大支持${this._maxFileSizeMB}MB`, 'error');
            return false;
        }
        
        try {
            gUI.showSpinner();
            
            // 读取文件内容
            const arrayBuffer = await this._readFileAsArrayBuffer(file);
            
            // 加载PDF文档
            const result = await gPDFManager.loadPdfFromArrayBuffer(arrayBuffer, file.name);
            
            if (result.success) {
                gUI.showMessage(`已加载文件: ${file.name}`, 'success');
                return true;
            } else {
                gUI.showMessage(`加载文件失败: ${result.error}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('加载文件错误:', error);
            gUI.showMessage('加载文件错误: ' + error.message, 'error');
            gUI.hideSpinner();
            return false;
        }
    }

    /**
     * 将文件读取为ArrayBuffer
     * @private
     * @param {File} file - 文件对象
     * @returns {Promise<ArrayBuffer>} - 文件内容的ArrayBuffer
     */
    _readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
}

// 创建单例
const gFileLoader = new FileLoader();
export default gFileLoader; 