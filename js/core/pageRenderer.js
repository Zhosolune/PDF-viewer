/**
 * 页面渲染器模块
 * 负责将PDF页面渲染到Canvas
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPDFManager from './pdfManager.js';

class PageRenderer {
    /**
     * 创建页面渲染器实例
     */
    constructor() {
        this._pageRendering = false;
        this._pageNumPending = null;
        this._pageTextContent = {};  // 缓存每页的文本内容
    }

    /**
     * 渲染单页视图
     * @param {number} pageNum - 页码
     * @param {boolean} isSearchNavigation - 是否是搜索导航
     * @returns {Promise<boolean>} - 渲染是否成功
     */
    async renderSinglePageView(pageNum, isSearchNavigation = false) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return false;
        
        try {
            // 获取Canvas和Context
            const canvas = document.getElementById('pdf-viewer');
            const ctx = canvas.getContext('2d');
            
            // 清除canvas-container内的内容
            const canvasContainer = document.getElementById('canvas-container');
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container';
            
            // 添加canvas和text-layer到container
            canvasContainer.appendChild(canvas);
            
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            textLayerDiv.id = 'text-layer';
            canvasContainer.appendChild(textLayerDiv);
            
            // 获取当前页面
            const page = await pdfDoc.getPage(pageNum);
            
            // 计算缩放后的视口
            const scale = gAppState.getScale();
            const viewport = page.getViewport({ scale });
            
            // 设置canvas尺寸
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'page-canvas';
            canvas.classList.add('active');
            
            // 渲染PDF页面到Canvas
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            // 开始渲染
            const renderTask = page.render(renderContext);
            
            // 等待渲染完成
            await renderTask.promise;
            
            // 渲染文本层
            await this._renderTextLayer(page, viewport, textLayerDiv);
            
            // 如果是搜索导航，在渲染后突出显示当前匹配项
            if (isSearchNavigation) {
                gEventBus.publish('update-search-matches');
            }
            
            return true;
        } catch (error) {
            console.error('渲染页面错误:', error);
            gUI.showMessage('渲染页面错误: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 渲染双页视图
     * @param {number} pageNum - 页码
     * @param {boolean} isSearchNavigation - 是否是搜索导航
     * @returns {Promise<boolean>} - 渲染是否成功
     */
    async renderDoublePageView(pageNum, isSearchNavigation = false) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return false;
        
        try {
            // 清除canvas-container内的内容
            const canvasContainer = document.getElementById('canvas-container');
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container double-view';
            
            // 创建左侧页面的包装器
            const leftPageWrapper = document.createElement('div');
            leftPageWrapper.className = 'page-wrapper';
            
            // 创建左侧页面的Canvas
            const leftCanvas = document.createElement('canvas');
            leftCanvas.className = 'page-canvas';
            leftPageWrapper.appendChild(leftCanvas);
            
            // 创建左侧页面的文本层
            const leftTextLayer = document.createElement('div');
            leftTextLayer.className = 'page-text-layer';
            leftPageWrapper.appendChild(leftTextLayer);
            
            // 添加左侧页面到容器
            canvasContainer.appendChild(leftPageWrapper);
            
            // 渲染左侧页面
            await this._renderPageToCanvas(pageNum, leftCanvas, leftTextLayer);
            
            // 如果存在下一页，渲染右侧页面
            if (pageNum < pdfDoc.numPages) {
                // 创建右侧页面的包装器
                const rightPageWrapper = document.createElement('div');
                rightPageWrapper.className = 'page-wrapper';
                
                // 创建右侧页面的Canvas
                const rightCanvas = document.createElement('canvas');
                rightCanvas.className = 'page-canvas';
                rightPageWrapper.appendChild(rightCanvas);
                
                // 创建右侧页面的文本层
                const rightTextLayer = document.createElement('div');
                rightTextLayer.className = 'page-text-layer';
                rightPageWrapper.appendChild(rightTextLayer);
                
                // 添加右侧页面到容器
                canvasContainer.appendChild(rightPageWrapper);
                
                // 渲染右侧页面
                await this._renderPageToCanvas(pageNum + 1, rightCanvas, rightTextLayer);
            }
            
            // 如果是搜索导航，在渲染后突出显示当前匹配项
            if (isSearchNavigation) {
                gEventBus.publish('update-search-matches');
            }
            
            return true;
        } catch (error) {
            console.error('渲染双页视图错误:', error);
            gUI.showMessage('渲染双页视图错误: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 将页面渲染到指定的Canvas和文本层
     * @private
     * @param {number} pageNum - 页码
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {HTMLElement} textLayer - 文本层元素
     * @returns {Promise<boolean>} - 渲染是否成功
     */
    async _renderPageToCanvas(pageNum, canvas, textLayer) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return false;
        
        try {
            // 获取页面
            const page = await pdfDoc.getPage(pageNum);
            
            // 计算缩放后的视口
            const scale = gAppState.getScale();
            const viewport = page.getViewport({ scale });
            
            // 设置canvas尺寸
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // 渲染PDF页面到Canvas
            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            };
            
            // 开始渲染
            const renderTask = page.render(renderContext);
            
            // 等待渲染完成
            await renderTask.promise;
            
            // 渲染文本层
            await this._renderTextLayer(page, viewport, textLayer);
            
            return true;
        } catch (error) {
            console.error(`渲染第${pageNum}页错误:`, error);
            return false;
        }
    }

    /**
     * 渲染文本层
     * @private
     * @param {Object} page - PDF页面对象
     * @param {Object} viewport - 视口对象
     * @param {HTMLElement} textLayerDiv - 文本层DOM元素
     * @returns {Promise<void>}
     */
    async _renderTextLayer(page, viewport, textLayerDiv) {
        try {
            // 清空文本层
            textLayerDiv.innerHTML = '';
            
            // 获取页面文本内容
            const textContent = await page.getTextContent();
            
            // 缓存文本内容
            const pageNum = page.pageNumber;
            this._pageTextContent[pageNum] = {
                textItems: textContent.items,
                viewport: viewport
            };
            
            // 创建文本层项
            const textLayerFrag = document.createDocumentFragment();
            
            textContent.items.forEach(item => {
                const tx = pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform
                );
                
                const style = `
                    left: ${tx[4]}px;
                    top: ${tx[5]}px;
                    font-size: ${tx[0]}px;
                    transform: scaleX(${tx[0] / tx[3]});
                `;
                
                const textSpan = document.createElement('span');
                textSpan.textContent = item.str;
                textSpan.style.cssText = style;
                
                textLayerFrag.appendChild(textSpan);
            });
            
            // 添加文本层项到文本层
            textLayerDiv.appendChild(textLayerFrag);
        } catch (error) {
            console.error('渲染文本层错误:', error);
        }
    }

    /**
     * 渲染页面
     * @param {number} num - 页码
     * @param {boolean} isSearchNavigation - 是否是搜索导航
     * @returns {Promise<boolean>} - 渲染是否成功
     */
    async renderPage(num, isSearchNavigation = false) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return false;
        
        const pageCount = pdfDoc.numPages;
        
        // 验证页码范围
        if (num < 1 || num > pageCount) {
            return false;
        }
        
        gAppState.setState({ pageNum: num });
        gUI.updateCurrentPageDisplay(num);
        
        // 如果已经有渲染操作在进行中，将当前操作加入队列
        if (this._pageRendering) {
            this._pageNumPending = num;
            return false;
        }
        
        this._pageRendering = true;
        
        try {
            let success;
            
            // 根据视图模式选择渲染方法
            if (gAppState.getIsDoublePageView()) {
                success = await this.renderDoublePageView(num, isSearchNavigation);
            } else {
                success = await this.renderSinglePageView(num, isSearchNavigation);
            }
            
            this._pageRendering = false;
            
            // 检查是否有待处理的渲染请求
            if (this._pageNumPending !== null) {
                const pendingPageNum = this._pageNumPending;
                this._pageNumPending = null;
                await this.renderPage(pendingPageNum, isSearchNavigation);
            }
            
            // 发布页面渲染完成事件
            gEventBus.publish('page-rendered', {
                pageNum: num,
                isSearchNavigation
            });
            
            return success;
        } catch (error) {
            console.error('渲染页面错误:', error);
            this._pageRendering = false;
            return false;
        }
    }

    /**
     * 获取页面文本内容
     * @param {number} pageNumber - 页码
     * @returns {Promise<Object>} - 文本内容和位置信息
     */
    async getPageTextContent(pageNumber) {
        // 如果已缓存，直接返回
        if (this._pageTextContent[pageNumber]) {
            return this._pageTextContent[pageNumber];
        }
        
        try {
            const pdfDoc = gAppState.getPdfDoc();
            if (!pdfDoc) {
                throw new Error('没有加载PDF文档');
            }
            
            const page = await pdfDoc.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const scale = gAppState.getScale();
            const viewport = page.getViewport({ scale });
            
            // 缓存文本内容
            this._pageTextContent[pageNumber] = {
                textItems: textContent.items,
                viewport: viewport
            };
            
            return this._pageTextContent[pageNumber];
        } catch (error) {
            console.error('获取页面文本内容出错:', error);
            return { textItems: [], viewport: null };
        }
    }

    /**
     * 清除文本层
     */
    clearTextLayer() {
        if (gAppState.getIsDoublePageView()) {
            // 双页视图模式下清除所有文本层
            const textLayers = document.querySelectorAll('.page-text-layer');
            textLayers.forEach(layer => {
                layer.innerHTML = '';
            });
        } else {
            // 单页视图模式
            const textLayer = document.getElementById('text-layer');
            if (textLayer) {
                textLayer.innerHTML = '';
            }
        }
    }

    /**
     * 清除缓存的页面文本内容
     */
    clearPageTextContent() {
        this._pageTextContent = {};
    }
}

// 创建单例
const gPageRenderer = new PageRenderer();
export default gPageRenderer; 