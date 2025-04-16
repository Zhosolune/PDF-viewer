/**
 * 视图模式管理模块
 * 负责管理单页/双页视图切换
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPageRenderer from './pageRenderer.js';

class ViewModes {
    /**
     * 创建视图模式管理器实例
     */
    constructor() {
        // 初始化监听器
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 监听视图模式变化事件
        gEventBus.subscribe('view-mode-single', this.setSinglePageView.bind(this));
        gEventBus.subscribe('view-mode-double', this.setDoublePageView.bind(this));
        
        // 监听UI按钮点击事件
        document.getElementById('single-page-view').addEventListener('click', () => {
            this.setSinglePageView();
        });
        
        document.getElementById('double-page-view').addEventListener('click', () => {
            this.setDoublePageView();
        });
    }

    /**
     * 切换到单页视图
     */
    async setSinglePageView() {
        // 如果当前已经是单页视图，不做任何操作
        if (!gAppState.getIsDoublePageView()) {
            return;
        }
        
        // 更新应用状态
        gAppState.setState({ isDoublePageView: false });
        
        // 更新UI
        gUI.updateViewModeButtons(false);
        
        // 重新渲染当前页面
        await gPageRenderer.renderPage(gAppState.getPageNum());
        
        // 发布视图模式更改事件
        gEventBus.publish('view-mode-changed', { mode: 'single' });
    }

    /**
     * 切换到双页视图
     */
    async setDoublePageView() {
        // 如果当前已经是双页视图，不做任何操作
        if (gAppState.getIsDoublePageView()) {
            return;
        }
        
        // 确保当前页码是奇数（始终从左侧页面开始）
        let currentPage = gAppState.getPageNum();
        if (currentPage % 2 === 0 && currentPage > 1) {
            currentPage--;
        }
        
        // 更新应用状态
        gAppState.setState({ 
            isDoublePageView: true,
            pageNum: currentPage
        });
        
        // 更新UI
        gUI.updateViewModeButtons(true);
        gUI.updateCurrentPageDisplay(currentPage);
        
        // 重新渲染当前页面
        await gPageRenderer.renderPage(currentPage);
        
        // 发布视图模式更改事件
        gEventBus.publish('view-mode-changed', { mode: 'double' });
    }

    /**
     * 获取当前视图模式
     * @returns {string} - 'single' 或 'double'
     */
    getCurrentViewMode() {
        return gAppState.getIsDoublePageView() ? 'double' : 'single';
    }

    /**
     * 根据视图模式计算页面增量
     * 在双页视图中，下一页需要跳转2页
     * @returns {number} - 页面增量
     */
    getPageIncrement() {
        return gAppState.getIsDoublePageView() ? 2 : 1;
    }
}

// 创建单例
const gViewModes = new ViewModes();
export default gViewModes; 