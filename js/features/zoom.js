/**
 * 缩放功能模块
 * 处理PDF文档的缩放功能
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPageRenderer from '../core/pageRenderer.js';

class Zoom {
    /**
     * 创建缩放功能模块实例
     */
    constructor() {
        // 缩放步长
        this._zoomStep = 0.1;
        
        // 最小和最大缩放比例
        this._minScale = 0.25;
        this._maxScale = 4.0;
        
        // 初始化事件监听
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 监听缩放事件
        gEventBus.subscribe('zoom-in', this.zoomIn.bind(this));
        gEventBus.subscribe('zoom-out', this.zoomOut.bind(this));
        gEventBus.subscribe('zoom-reset', this.resetZoom.bind(this));
        
        // 添加UI元素事件监听
        document.getElementById('zoom-in').addEventListener('click', this.zoomIn.bind(this));
        document.getElementById('zoom-out').addEventListener('click', this.zoomOut.bind(this));
        document.getElementById('zoom-reset').addEventListener('click', this.resetZoom.bind(this));
    }

    /**
     * 放大
     */
    async zoomIn() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const currentScale = gAppState.getScale();
        const newScale = Math.min(this._maxScale, currentScale + this._zoomStep);
        
        // 如果缩放比例没有变化，不执行任何操作
        if (newScale === currentScale) return;
        
        // 更新应用状态
        gAppState.setState({ scale: newScale });
        
        // 更新UI
        gUI.updateZoomDisplay(newScale);
        
        // 重新渲染当前页面
        const currentPage = gAppState.getPageNum();
        await gPageRenderer.renderPage(currentPage);
        
        // 发布缩放变更事件
        gEventBus.publish('zoom-changed', { scale: newScale });
    }

    /**
     * 缩小
     */
    async zoomOut() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const currentScale = gAppState.getScale();
        const newScale = Math.max(this._minScale, currentScale - this._zoomStep);
        
        // 如果缩放比例没有变化，不执行任何操作
        if (newScale === currentScale) return;
        
        // 更新应用状态
        gAppState.setState({ scale: newScale });
        
        // 更新UI
        gUI.updateZoomDisplay(newScale);
        
        // 重新渲染当前页面
        const currentPage = gAppState.getPageNum();
        await gPageRenderer.renderPage(currentPage);
        
        // 发布缩放变更事件
        gEventBus.publish('zoom-changed', { scale: newScale });
    }

    /**
     * 重置缩放比例到默认值
     */
    async resetZoom() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const defaultScale = gAppState.getDefaultScale();
        const currentScale = gAppState.getScale();
        
        // 如果缩放比例没有变化，不执行任何操作
        if (defaultScale === currentScale) return;
        
        // 更新应用状态
        gAppState.setState({ scale: defaultScale });
        
        // 更新UI
        gUI.updateZoomDisplay(defaultScale);
        
        // 重新渲染当前页面
        const currentPage = gAppState.getPageNum();
        await gPageRenderer.renderPage(currentPage);
        
        // 发布缩放变更事件
        gEventBus.publish('zoom-changed', { scale: defaultScale });
    }

    /**
     * 设置特定的缩放比例
     * @param {number} scale - 目标缩放比例
     */
    async setZoom(scale) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        // 确保缩放比例在有效范围内
        const newScale = Math.max(this._minScale, Math.min(this._maxScale, scale));
        const currentScale = gAppState.getScale();
        
        // 如果缩放比例没有变化，不执行任何操作
        if (newScale === currentScale) return;
        
        // 更新应用状态
        gAppState.setState({ scale: newScale });
        
        // 更新UI
        gUI.updateZoomDisplay(newScale);
        
        // 重新渲染当前页面
        const currentPage = gAppState.getPageNum();
        await gPageRenderer.renderPage(currentPage);
        
        // 发布缩放变更事件
        gEventBus.publish('zoom-changed', { scale: newScale });
    }

    /**
     * 获取当前缩放比例
     * @returns {number} - 当前缩放比例
     */
    getCurrentZoom() {
        return gAppState.getScale();
    }

    /**
     * 获取默认缩放比例
     * @returns {number} - 默认缩放比例
     */
    getDefaultZoom() {
        return gAppState.getDefaultScale();
    }
}

// 创建单例
const gZoom = new Zoom();
export default gZoom; 