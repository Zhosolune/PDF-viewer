/**
 * 应用状态管理
 * 集中管理共享状态，并通过事件通知状态变化
 */
import gEventBus from './eventBus.js';

const gAppState = {
    /**
     * 应用状态
     * @private
     */
    _state: {
        pdfDoc: null,          // 当前PDF文档
        pageNum: 1,            // 当前页码
        pageCount: 0,          // 总页数
        scale: 1.0,            // 当前缩放比例
        defaultScale: 1.0,     // 默认缩放比例
        isDoublePageView: false, // 是否双页视图
        currentFilename: '未选择文件', // 当前文件名
        isRendering: false,    // 是否正在渲染
        searchQuery: '',       // 搜索查询
        searchMatches: [],     // 搜索匹配结果
        currentMatchIndex: -1, // 当前匹配项索引
    },
    
    /**
     * 获取整个状态的副本
     * @returns {Object} 状态副本
     */
    getState() {
        return { ...this._state };
    },
    
    /**
     * 更新状态
     * @param {Object} newState - 新状态
     */
    setState(newState) {
        const oldState = { ...this._state };
        this._state = { ...this._state, ...newState };
        
        // 发布状态变化事件
        gEventBus.publish('state-changed', {
            oldState,
            newState: this._state,
            changedProps: Object.keys(newState)
        });
        
        // 发布特定状态变化事件
        Object.keys(newState).forEach(key => {
            if (oldState[key] !== this._state[key]) {
                gEventBus.publish(`state-${key}-changed`, {
                    oldValue: oldState[key],
                    newValue: this._state[key]
                });
            }
        });
    },
    
    // 特定的状态获取器
    getPdfDoc() { return this._state.pdfDoc; },
    getPageNum() { return this._state.pageNum; },
    getPageCount() { return this._state.pageCount; },
    getScale() { return this._state.scale; },
    getDefaultScale() { return this._state.defaultScale; },
    getIsDoublePageView() { return this._state.isDoublePageView; },
    getCurrentFilename() { return this._state.currentFilename; },
    getIsRendering() { return this._state.isRendering; },
    getSearchQuery() { return this._state.searchQuery; },
    getSearchMatches() { return this._state.searchMatches; },
    getCurrentMatchIndex() { return this._state.currentMatchIndex; },
    
    // 状态重置
    resetState() {
        this.setState({
            pdfDoc: null,
            pageNum: 1,
            pageCount: 0,
            scale: this._state.defaultScale,
            isDoublePageView: false,
            currentFilename: '未选择文件',
            isRendering: false,
            searchQuery: '',
            searchMatches: [],
            currentMatchIndex: -1,
        });
    }
};

export default gAppState; 