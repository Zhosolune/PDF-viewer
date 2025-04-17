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
        
        // 发布布局调整事件
        gEventBus.publish('layout-adjusted', {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        });
    }
}

// 创建单例
const gResponsiveLayout = new ResponsiveLayout();
export default gResponsiveLayout; 