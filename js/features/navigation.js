/**
 * 页面导航模块
 * 处理PDF文档的页面导航功能
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPageRenderer from '../core/pageRenderer.js';
import gViewModes from '../core/viewModes.js';

class Navigation {
    /**
     * 创建导航模块实例
     */
    constructor() {
        // 初始化事件监听
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 监听页面导航事件
        gEventBus.subscribe('navigation-prev-page', this.goToPrevPage.bind(this));
        gEventBus.subscribe('navigation-next-page', this.goToNextPage.bind(this));
        gEventBus.subscribe('navigation-first-page', this.goToFirstPage.bind(this));
        gEventBus.subscribe('navigation-last-page', this.goToLastPage.bind(this));
        gEventBus.subscribe('page-number-input-changed', this.goToPage.bind(this));
        
        // 添加UI元素事件监听
        document.getElementById('prev-page').addEventListener('click', this.goToPrevPage.bind(this));
        document.getElementById('next-page').addEventListener('click', this.goToNextPage.bind(this));
        document.getElementById('current-page').addEventListener('change', this._onPageNumberChanged.bind(this));
    }

    /**
     * 页码输入框变更处理
     * @private
     * @param {Event} event - 输入框事件
     */
    _onPageNumberChanged(event) {
        const pageNum = parseInt(event.target.value, 10);
        this.goToPage({ value: pageNum });
    }

    /**
     * 转到指定页面
     * @param {Object} data - 包含页码值的对象
     * @param {number} data.value - 目标页码
     */
    async goToPage({ value }) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const pageCount = pdfDoc.numPages;
        let newPageNum = Math.max(1, Math.min(pageCount, value));
        
        // 在双页视图中，确保页码是奇数
        if (gAppState.getIsDoublePageView() && newPageNum % 2 === 0 && newPageNum > 1) {
            newPageNum--;
        }
        
        // 渲染新页面
        await gPageRenderer.renderPage(newPageNum);
    }

    /**
     * 转到上一页
     */
    async goToPrevPage() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const currentPage = gAppState.getPageNum();
        const increment = gViewModes.getPageIncrement();
        const newPageNum = Math.max(1, currentPage - increment);
        
        await gPageRenderer.renderPage(newPageNum);
    }

    /**
     * 转到下一页
     */
    async goToNextPage() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        const currentPage = gAppState.getPageNum();
        const increment = gViewModes.getPageIncrement();
        const pageCount = pdfDoc.numPages;
        
        // 在双页视图中，当前页面+1不能超过总页数
        let maxPage = pageCount;
        if (gAppState.getIsDoublePageView() && currentPage + 1 <= pageCount) {
            maxPage = pageCount - 1;
        }
        
        const newPageNum = Math.min(maxPage, currentPage + increment);
        
        await gPageRenderer.renderPage(newPageNum);
    }

    /**
     * 转到第一页
     */
    async goToFirstPage() {
        await gPageRenderer.renderPage(1);
    }

    /**
     * 转到最后一页
     */
    async goToLastPage() {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc) return;
        
        let lastPage = pdfDoc.numPages;
        
        // 在双页视图中，确保最后一页是奇数
        if (gAppState.getIsDoublePageView() && lastPage % 2 === 0) {
            lastPage--;
        }
        
        await gPageRenderer.renderPage(lastPage);
    }

    /**
     * 获取当前页码
     * @returns {number} - 当前页码
     */
    getCurrentPage() {
        return gAppState.getPageNum();
    }

    /**
     * 获取总页数
     * @returns {number} - 总页数
     */
    getPageCount() {
        const pdfDoc = gAppState.getPdfDoc();
        return pdfDoc ? pdfDoc.numPages : 0;
    }
}

// 创建单例
const gNavigation = new Navigation();
export default gNavigation; 