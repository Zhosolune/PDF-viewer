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
        if (!pdfDoc) {
            console.error('尝试渲染单页视图时没有加载PDF文档');
            return false;
        }
        
        try {
            // 获取canvas容器
            const canvasContainer = document.getElementById('canvas-container');
            if (!canvasContainer) {
                console.error('找不到canvas容器元素');
                return false;
            }
            
            // 尝试获取现有的canvas元素
            let canvas = document.getElementById('pdf-viewer');
            
            // 检查canvas是否存在，如果不在容器内，可能是之前被双页视图隐藏了
            if (!canvas || !document.body.contains(canvas)) {
                console.log('找不到现有canvas，将创建新的canvas元素');
                // 创建新的canvas
                canvas = document.createElement('canvas');
                canvas.id = 'pdf-viewer';
            } else if (!canvasContainer.contains(canvas)) {
                // 尝试找到被隐藏的canvas
                console.log('尝试找到被隐藏的canvas元素');
                const hiddenCanvas = document.querySelector('#pdf-viewer[style*="display: none"]');
                if (hiddenCanvas) {
                    canvas = hiddenCanvas;
                    hiddenCanvas.style.display = ''; // 移除隐藏样式
                    console.log('找到并恢复了隐藏的canvas元素');
                } else {
                    // 如果找不到隐藏的canvas，先保留当前找到的canvas
                    console.log('未找到隐藏的canvas，将使用现有canvas元素');
                }
                
                // 如果canvas在其他地方，从原位置移除
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                    console.log('从原位置移除canvas元素');
                }
            } else {
                // 保存原始canvas元素
                canvasContainer.removeChild(canvas);
                console.log('保存原始canvas元素');
            }
            
            // 清空容器并重置类名
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container';
            console.log('清空并重置canvas容器');
            
            // 添加canvas回容器
            canvasContainer.appendChild(canvas);
            console.log('将canvas元素添加到容器中');
            
            // 创建文本层
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            textLayerDiv.id = 'text-layer';
            canvasContainer.appendChild(textLayerDiv);
            console.log('创建并添加文本层');
            
            // 获取当前页面
            console.log(`获取PDF页面: ${pageNum}`);
            const page = await pdfDoc.getPage(pageNum);
            
            // 计算缩放后的视口
            const scale = gAppState.getScale();
            const viewport = page.getViewport({ scale });
            console.log(`计算视口: 缩放比例=${scale}, 宽度=${viewport.width}, 高度=${viewport.height}`);
            
            // 设置canvas尺寸
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'page-canvas';
            canvas.classList.add('active');
            console.log(`设置canvas尺寸: ${canvas.width}x${canvas.height}`);
            
            // 渲染PDF页面到Canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('无法获取canvas上下文');
                return false;
            }
            
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            // 开始渲染
            console.log('开始渲染PDF页面到canvas');
            const renderTask = page.render(renderContext);
            
            // 等待渲染完成
            await renderTask.promise;
            console.log('PDF页面渲染完成');
            
            // 仅在有搜索查询时处理文本层内容，避免文字重叠问题
            if (gAppState.getSearchQuery()) {
                console.log('发现搜索查询，渲染文本层内容');
                // 渲染文本层
                await this._renderTextLayer(page, viewport, textLayerDiv);
            }
            
            // 如果是搜索导航，在渲染后突出显示当前匹配项
            if (isSearchNavigation) {
                console.log('触发更新搜索匹配项');
                gEventBus.publish('update-search-matches');
            }
            
            return true;
        } catch (error) {
            console.error('渲染单页视图错误:', error);
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
        if (!pdfDoc) {
            console.error('尝试渲染双页视图时没有加载PDF文档');
            return false;
        }
        
        try {
            // 获取canvas容器
            const canvasContainer = document.getElementById('canvas-container');
            if (!canvasContainer) {
                console.error('找不到canvas容器元素');
                return false;
            }
            
            console.log('开始渲染双页视图: ', pageNum);
            
            // 查找原始canvas元素，可能在容器内，也可能在body中被隐藏
            let originalCanvas = document.getElementById('pdf-viewer');
            if (!originalCanvas) {
                console.log('找不到pdf-viewer canvas，创建新的canvas元素');
                originalCanvas = document.createElement('canvas');
                originalCanvas.id = 'pdf-viewer';
            } else {
                console.log('找到现有的pdf-viewer canvas');
                
                // 如果canvas在容器中，先移除
                if (canvasContainer.contains(originalCanvas)) {
                    console.log('从容器中移除原始canvas');
                    canvasContainer.removeChild(originalCanvas);
                } else if (originalCanvas.parentNode) {
                    // 如果在其他地方，也移除
                    console.log('从其他位置移除原始canvas');
                    originalCanvas.parentNode.removeChild(originalCanvas);
                }
            }
            
            // 清空容器
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container double-view';
            console.log('清空并设置双页视图容器样式');
            
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
            console.log('创建并添加左侧页面元素');
            
            // 渲染左侧页面
            console.log(`开始渲染左侧页面: ${pageNum}`);
            const leftPageSuccess = await this._renderPageToCanvas(pageNum, leftCanvas, leftTextLayer);
            if (!leftPageSuccess) {
                console.error(`渲染左侧页面 ${pageNum} 失败`);
            }
            
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
                console.log('创建并添加右侧页面元素');
                
                // 渲染右侧页面
                console.log(`开始渲染右侧页面: ${pageNum + 1}`);
                const rightPageSuccess = await this._renderPageToCanvas(pageNum + 1, rightCanvas, rightTextLayer);
                if (!rightPageSuccess) {
                    console.error(`渲染右侧页面 ${pageNum + 1} 失败`);
                }
            } else {
                console.log(`这是最后一页，不渲染右侧页面`);
            }
            
            // 保存原始canvas以备后用（隐藏起来）
            originalCanvas.style.display = 'none';
            document.body.appendChild(originalCanvas);
            console.log('隐藏并保存原始canvas元素到body');
            
            // 如果是搜索导航，在渲染后突出显示当前匹配项
            if (isSearchNavigation) {
                console.log('触发更新搜索匹配项');
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
            // 检查canvas元素是否有效
            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                console.error('无效的canvas元素:', canvas);
                return false;
            }
            
            // 检查文本层元素是否有效
            if (!textLayer || !(textLayer instanceof HTMLElement)) {
                console.error('无效的文本层元素:', textLayer);
                return false;
            }
            
            // 检查页码是否有效
            if (pageNum < 1 || pageNum > pdfDoc.numPages) {
                console.error(`无效的页码: ${pageNum}，PDF总页数: ${pdfDoc.numPages}`);
                return false;
            }
            
            // 获取页面
            const page = await pdfDoc.getPage(pageNum);
            
            // 计算缩放后的视口
            const scale = gAppState.getScale();
            const viewport = page.getViewport({ scale });
            
            // 设置canvas尺寸
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // 获取canvas上下文，确保有效
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('无法获取canvas上下文');
                return false;
            }
            
            // 渲染PDF页面到Canvas
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            // 开始渲染
            const renderTask = page.render(renderContext);
            
            // 等待渲染完成
            await renderTask.promise;
            
            // 仅在有搜索查询时渲染文本层
            if (gAppState.getSearchQuery()) {
                await this._renderTextLayer(page, viewport, textLayer);
            }
            
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
            
            // 仅在搜索时使用文本层，否则不显示文本（避免文字重叠问题）
            if (gAppState.getSearchQuery()) {
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
                        opacity: 0;  /* 设置文本透明，只用于搜索匹配 */
                    `;
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = item.str;
                    textSpan.style.cssText = style;
                    textSpan.dataset.pageNum = pageNum;  // 添加页码数据属性，便于搜索匹配
                    
                    textLayerFrag.appendChild(textSpan);
                });
                
                // 添加文本层项到文本层
                textLayerDiv.appendChild(textLayerFrag);
            }
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
        try {
            const pdfDoc = gAppState.getPdfDoc();
            if (!pdfDoc) {
                console.error('尝试渲染页面时没有加载PDF文档');
                return false;
            }
            
            const pageCount = pdfDoc.numPages;
            
            // 验证页码范围
            if (num < 1 || num > pageCount) {
                console.error(`无效的页码: ${num}，PDF总页数: ${pageCount}`);
                return false;
            }
            
            // 更新当前页码
            gAppState.setState({ pageNum: num });
            gUI.updateCurrentPageDisplay(num);
            
            // 如果已经有渲染操作在进行中，将当前操作加入队列
            if (this._pageRendering) {
                console.log(`渲染操作进行中，将页码 ${num} 加入队列`);
                this._pageNumPending = num;
                return false;
            }
            
            // 标记渲染开始
            this._pageRendering = true;
            gAppState.setState({ isRendering: true });
            
            try {
                let success;
                
                // 根据视图模式选择渲染方法
                if (gAppState.getIsDoublePageView()) {
                    success = await this.renderDoublePageView(num, isSearchNavigation);
                } else {
                    success = await this.renderSinglePageView(num, isSearchNavigation);
                }
                
                if (!success) {
                    console.error(`渲染页码 ${num} 失败`);
                }
                
                // 标记渲染结束
                this._pageRendering = false;
                gAppState.setState({ isRendering: false });
                
                // 检查是否有待处理的渲染请求
                if (this._pageNumPending !== null) {
                    const pendingPageNum = this._pageNumPending;
                    this._pageNumPending = null;
                    console.log(`处理待渲染的页码: ${pendingPageNum}`);
                    await this.renderPage(pendingPageNum, isSearchNavigation);
                }
                
                // 发布页面渲染完成事件
                gEventBus.publish('page-rendered', {
                    pageNum: num,
                    isSearchNavigation,
                    success
                });
                
                return success;
            } catch (error) {
                console.error('渲染页面错误:', error);
                this._pageRendering = false;
                gAppState.setState({ isRendering: false });
                return false;
            }
        } catch (error) {
            console.error('渲染页面过程中发生异常:', error);
            this._pageRendering = false;
            gAppState.setState({ isRendering: false });
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
        // 清除所有可能的文本层
        // 首先检查双页视图的文本层
        const doubleViewTextLayers = document.querySelectorAll('.page-text-layer');
        doubleViewTextLayers.forEach(layer => {
            layer.innerHTML = '';
        });
        
        // 然后检查单页视图的文本层
        const singleViewTextLayer = document.getElementById('text-layer');
        if (singleViewTextLayer) {
            singleViewTextLayer.innerHTML = '';
        }
        
        // 最后，查找并清除任何其他可能存在的文本层
        const allTextLayers = document.querySelectorAll('[class*="text-layer"]');
        allTextLayers.forEach(layer => {
            if (layer !== singleViewTextLayer && !Array.from(doubleViewTextLayers).includes(layer)) {
                layer.innerHTML = '';
            }
        });
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