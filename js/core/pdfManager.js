/**
 * PDF文档管理模块
 * 负责初始化PDF.js和管理PDF文档
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';

class PDFManager {
    /**
     * 创建PDF管理器实例
     */
    constructor() {
        this._pdfDoc = null;
        this._initialized = false;
    }

    /**
     * 初始化PDF.js库
     */
    init() {
        // 确保pdfjsLib已加载
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js库未正确加载，请检查引用');
            gUI.showMessage('PDF.js库未正确加载，请刷新页面重试', 'error');
            return false;
        }
        
        try {
            // 设置worker路径
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            console.log('PDF.js Worker设置完成');
            this._initialized = true;
            return true;
        } catch (error) {
            console.error('PDF.js初始化错误:', error);
            gUI.showMessage('PDF.js初始化错误: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 从ArrayBuffer加载PDF文档
     * @param {ArrayBuffer} arrayBuffer - PDF文件的ArrayBuffer
     * @param {string} filename - 文件名
     * @returns {Promise<Object>} - 加载结果对象
     */
    async loadPdfFromArrayBuffer(arrayBuffer, filename) {
        // 确保PDF.js已初始化
        if (!this._initialized && !this.init()) {
            return { success: false, error: 'PDF.js未初始化' };
        }
        
        try {
            gUI.showSpinner();
            
            // 清除现有的PDF文档
            if (this._pdfDoc) {
                await this._pdfDoc.destroy();
                this._pdfDoc = null;
            }
            
            // 加载PDF文档
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            
            // 更新UI显示文件名
            gUI.updatePdfFilename(filename);
            
            // 等待加载完成
            this._pdfDoc = await loadingTask.promise;
            
            // 更新应用状态
            gAppState.setState({
                pdfDoc: this._pdfDoc,
                pageCount: this._pdfDoc.numPages,
                pageNum: 1,
                currentFilename: filename,
                scale: gAppState.getDefaultScale(),
                isDoublePageView: false
            });
            
            // 更新UI
            gUI.updateUIForPdfLoaded(this._pdfDoc.numPages);
            gUI.hideSpinner();
            
            // 发布PDF加载完成事件
            gEventBus.publish('pdf-loaded', {
                pdfDoc: this._pdfDoc,
                pageCount: this._pdfDoc.numPages,
                filename
            });
            
            return {
                success: true,
                pageCount: this._pdfDoc.numPages,
                pdfDoc: this._pdfDoc
            };
        } catch (error) {
            console.error('加载PDF文档错误:', error);
            gUI.showMessage('加载PDF文档错误: ' + error.message, 'error');
            gUI.hideSpinner();
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 关闭当前PDF文档
     */
    async closePdf() {
        try {
            if (this._pdfDoc) {
                await this._pdfDoc.destroy();
                this._pdfDoc = null;
                
                // 更新应用状态
                gAppState.resetState();
                
                // 更新UI
                gUI.updateUIForNoPdf();
                gUI.updatePdfFilename(null);
                
                // 发布PDF关闭事件
                gEventBus.publish('pdf-closed');
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('关闭PDF文档错误:', error);
            return false;
        }
    }

    /**
     * 获取指定页面
     * @param {number} pageNum - 页码
     * @returns {Promise<Object>} - 页面对象
     */
    async getPage(pageNum) {
        if (!this._pdfDoc) {
            throw new Error('没有加载PDF文档');
        }
        
        try {
            return await this._pdfDoc.getPage(pageNum);
        } catch (error) {
            console.error(`获取第${pageNum}页出错:`, error);
            throw error;
        }
    }

    /**
     * 获取当前PDF文档
     * @returns {Object} - PDF文档对象
     */
    getPdfDoc() {
        return this._pdfDoc;
    }

    /**
     * 获取总页数
     * @returns {number} - 总页数
     */
    getPageCount() {
        return this._pdfDoc ? this._pdfDoc.numPages : 0;
    }
}

// 创建单例
const gPDFManager = new PDFManager();
export default gPDFManager; 