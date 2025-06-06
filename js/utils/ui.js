/**
 * UI工具模块
 * 提供UI相关的辅助函数
 */

class UI {
    /**
     * 创建UI工具实例
     */
    constructor() {
        this._messageTimeout = null;
    }

    /**
     * 显示消息通知
     * @param {string} text - 消息文本
     * @param {string} type - 消息类型 (info, success, error)
     * @param {number} duration - 消息显示时间(毫秒)
     */
    showMessage(text, type = 'info', duration = 3000) {
        const message = document.getElementById('message');
        const messageContent = message.querySelector('.message-content');
        
        // 清除之前的定时器
        if (this._messageTimeout) {
            clearTimeout(this._messageTimeout);
        }
        
        // 设置消息内容和类型
        messageContent.textContent = text;
        message.className = `message message-${type}`;
        
        // 显示消息
        message.classList.add('show');
        
        // 设定时间后自动隐藏
        this._messageTimeout = setTimeout(() => {
            message.classList.remove('show');
        }, duration);
    }

    /**
     * 更新PDF文件名显示
     * @param {string} filename - 文件名
     */
    updatePdfFilename(filename) {
        const pdfFilename = document.getElementById('pdf-filename');
        
        if (filename) {
            pdfFilename.textContent = filename;
            pdfFilename.title = filename; // 添加鼠标悬停提示，显示完整文件名
        } else {
            pdfFilename.textContent = '未选择文件';
            pdfFilename.title = '';
        }
    }

    /**
     * 显示加载中的spinner
     */
    showSpinner() {
        const spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    }

    /**
     * 隐藏加载中的spinner
     */
    hideSpinner() {
        const spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    /**
     * 在有PDF文档时更新UI
     */
    updateUIForPdfLoaded(pageCount) {
        const pdfContainer = document.getElementById('pdf-container');
        const canvasContainer = document.getElementById('canvas-container');
        let pdfViewer = document.getElementById('pdf-viewer');
        const pageCountElement = document.getElementById('page-count');
        
        // 确保pdf-container存在
        if (!pdfContainer) {
            console.error('找不到PDF容器元素');
            return;
        }
        
        // 确保canvas-container存在
        if (!canvasContainer) {
            console.error('找不到Canvas容器元素');
            return;
        }
        
        // 添加has-pdf类到pdf-container
        pdfContainer.classList.add('has-pdf');
        
        // 检查pdfViewer是否存在，如果不存在则创建
        if (!pdfViewer) {
            console.log('找不到pdf-viewer元素，创建新的canvas元素');
            pdfViewer = document.createElement('canvas');
            pdfViewer.id = 'pdf-viewer';
            pdfViewer.className = 'page-canvas';
            
            // 确保canvas容器为空并有正确的类名
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container';
            
            // 添加canvas到容器
            canvasContainer.appendChild(pdfViewer);
        }
        
        // 显示PDF查看器
        pdfViewer.classList.add('active');
        
        // 更新页码计数
        if (pageCountElement) {
            pageCountElement.textContent = pageCount;
        } else {
            console.warn('找不到页码计数元素');
        }
    }

    /**
     * 在没有PDF文档时更新UI
     */
    updateUIForNoPdf() {
        const pdfContainer = document.getElementById('pdf-container');
        const pdfViewer = document.getElementById('pdf-viewer');
        
        // 确保pdf-container存在
        if (pdfContainer) {
            // 移除has-pdf类
            pdfContainer.classList.remove('has-pdf');
        } else {
            console.warn('找不到PDF容器元素');
        }
        
        // 隐藏PDF查看器（如果存在）
        if (pdfViewer) {
            pdfViewer.classList.remove('active');
        } else {
            console.warn('找不到pdf-viewer元素');
        }
        
        // 重置页码输入框
        const currentPageInput = document.getElementById('current-page');
        if (currentPageInput) {
            currentPageInput.value = 1;
        }
        
        // 重置页数显示
        const pageCountElement = document.getElementById('page-count');
        if (pageCountElement) {
            pageCountElement.textContent = '0';
        }
    }

    /**
     * 更新视图模式按钮的状态
     * @param {boolean} isDoublePageView - 是否双页视图
     */
    updateViewModeButtons(isDoublePageView) {
        const singlePageViewBtn = document.getElementById('single-page-view');
        const doublePageViewBtn = document.getElementById('double-page-view');
        
        if (isDoublePageView) {
            singlePageViewBtn.classList.remove('active');
            doublePageViewBtn.classList.add('active');
        } else {
            singlePageViewBtn.classList.add('active');
            doublePageViewBtn.classList.remove('active');
        }
    }

    /**
     * 更新当前页码显示
     * @param {number} pageNum - 当前页码
     */
    updateCurrentPageDisplay(pageNum) {
        const currentPageInput = document.getElementById('current-page');
        if (currentPageInput) {
            currentPageInput.value = pageNum;
        }
    }

    /**
     * 更新缩放比例显示
     * @param {number} scale - 缩放比例
     */
    updateZoomDisplay(scale) {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(scale * 100);
        }
    }

    /**
     * 更新搜索结果显示
     * @param {number} currentIndex - 当前匹配索引
     * @param {number} totalMatches - 匹配总数
     */
    updateSearchResults(currentIndex, totalMatches) {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            if (totalMatches > 0) {
                searchResults.textContent = `${currentIndex + 1}/${totalMatches}`;
            } else {
                searchResults.textContent = '无匹配';
            }
        }
    }
}

// 创建单例
const gUI = new UI();
export default gUI; 