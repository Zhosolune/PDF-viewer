/**
 * 响应式布局模块
 * 负责处理窗口大小变化，使PDF预览区域能够适应浏览器窗口
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gPageRenderer from '../core/pageRenderer.js';

class ResponsiveLayout {
    /**
     * 创建响应式布局管理器实例
     */
    constructor() {
        this._resizeTimeout = null;
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 监听窗口调整大小事件
        window.addEventListener('resize', this._handleWindowResize.bind(this));
        
        // 监听PDF加载完成事件
        gEventBus.subscribe('pdf-loaded', this._adjustLayout.bind(this));
        
        // 监听视图模式变化事件
        gEventBus.subscribe('view-mode-changed', this._adjustLayout.bind(this));
        
        // 监听缩放变化事件
        gEventBus.subscribe('state-scale-changed', this._adjustContainerHeight.bind(this));
        
        // 监听页面渲染完成事件
        gEventBus.subscribe('page-rendered', this._adjustContainerHeight.bind(this));
        
        // 初始化时调整一次布局
        this._adjustLayout();
    }

    /**
     * 处理窗口大小变化
     * @private
     * @param {Event} event - 调整大小事件
     */
    _handleWindowResize(event) {
        // 使用防抖动方式处理调整大小事件，避免频繁渲染
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
        
        this._resizeTimeout = setTimeout(() => {
            this._adjustLayout();
        }, 300); // 300毫秒的延迟
    }

    /**
     * 调整布局以适应当前窗口大小
     * @private
     */
    _adjustLayout() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return; // 如果没有加载PDF，不做任何操作
        
        // 获取当前页码
        const currentPage = gAppState.getPageNum();
        
        // 重新渲染当前页面，适应新的窗口大小
        gPageRenderer.renderPage(currentPage);
        
        // 调整容器高度以适应内容
        this._adjustContainerHeight();
        
        // 发布布局调整事件
        gEventBus.publish('layout-adjusted', {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        });
    }
    
    /**
     * 调整容器高度以适应内容，避免出现纵向滚动条
     * @private
     */
    _adjustContainerHeight() {
        // 延迟执行，等待渲染完成
        setTimeout(() => {
            const pdfContainer = document.getElementById('pdf-container');
            const canvasContainer = document.getElementById('canvas-container');
            
            if (!pdfContainer || !canvasContainer) return;
            
            // 获取当前缩放比例
            const scale = gAppState.getScale();
            const isDoublePageView = gAppState.getIsDoublePageView();
            
            // 获取canvas容器的实际高度
            const canvasHeight = canvasContainer.offsetHeight;
            
            // 考虑容器内边距
            const padding = 40; // 上下各20px的内边距
            
            // 计算需要的容器高度
            const neededHeight = canvasHeight + padding;
            
            // 获取当前窗口可见区域高度
            const viewportHeight = window.innerHeight;
            
            // 计算页面顶部元素（header, controls等）的高度
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const controlsHeight = document.querySelector('.controls')?.offsetHeight || 0;
            const topElementsHeight = headerHeight + controlsHeight + 40; // 40px为额外间距
            
            // 计算可用高度
            const availableHeight = viewportHeight - topElementsHeight;
            
            // 如果内容高度超过可用高度，则设置为可用高度
            // 否则，使用内容实际高度
            const optimalHeight = Math.min(neededHeight, availableHeight);
            
            console.log(`调整容器高度:
                - 画布高度: ${canvasHeight}px
                - 需要的高度: ${neededHeight}px
                - 可用高度: ${availableHeight}px
                - 最优高度: ${optimalHeight}px
                - 当前缩放: ${scale}
                - 双页视图: ${isDoublePageView}`);
            
            // 设置PDF容器的最小高度，确保内容能够完整显示
            pdfContainer.style.minHeight = `${optimalHeight}px`;
            
            // 如果使用了自动高度，这里可以不设置高度，让它自动适应内容
            // pdfContainer.style.height = 'auto';
        }, 100); // 100ms的延迟，等待渲染完成
    }
}

// 创建单例
const gResponsiveLayout = new ResponsiveLayout();
export default gResponsiveLayout; 