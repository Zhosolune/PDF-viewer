/**
 * 搜索功能模块
 * 处理PDF文档的文本搜索功能
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPageRenderer from '../core/pageRenderer.js';

class Search {
    /**
     * 创建搜索功能模块实例
     */
    constructor() {
        // 搜索相关变量
        this._searchMatches = [];
        this._currentMatchIndex = -1;
        
        // 最小搜索字符数
        this._minSearchLength = 2;
        
        // 初始化事件监听
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 监听搜索相关事件
        gEventBus.subscribe('search-next-match', this.goToNextMatch.bind(this));
        gEventBus.subscribe('search-prev-match', this.goToPrevMatch.bind(this));
        gEventBus.subscribe('update-search-matches', this.updateSearchMatchesForCurrentPage.bind(this));
        gEventBus.subscribe('page-rendered', this.updateSearchMatchesForCurrentPage.bind(this));
        
        // 添加UI元素事件监听
        const searchInput = document.getElementById('search-input');
        const searchPrev = document.getElementById('search-prev');
        const searchNext = document.getElementById('search-next');
        const searchClear = document.getElementById('search-clear');
        
        searchInput.addEventListener('input', this._onSearchInputChanged.bind(this));
        searchPrev.addEventListener('click', this.goToPrevMatch.bind(this));
        searchNext.addEventListener('click', this.goToNextMatch.bind(this));
        searchClear.addEventListener('click', this.clearSearch.bind(this));
    }

    /**
     * 搜索输入框变更处理
     * @private
     * @param {Event} event - 输入框事件
     */
    _onSearchInputChanged(event) {
        const query = event.target.value.trim();
        if (query.length >= this._minSearchLength) {
            this.searchText(query);
        } else if (query.length === 0) {
            this.clearSearch();
        }
    }

    /**
     * 清除搜索内容和高亮
     */
    clearSearch() {
        // 清空搜索框
        const searchInput = document.getElementById('search-input');
        searchInput.value = '';
        
        // 重置搜索状态
        this._searchMatches = [];
        this._currentMatchIndex = -1;
        
        // 更新应用状态
        gAppState.setState({
            searchQuery: '',
            searchMatches: [],
            currentMatchIndex: -1
        });
        
        // 更新UI
        gUI.updateSearchResults(0, 0);
        gPageRenderer.clearTextLayer();
        
        // 显示清除搜索的消息
        gUI.showMessage('搜索已清除', 'info');
    }

    /**
     * 搜索文本
     * @param {string} query - 搜索查询字符串
     */
    async searchText(query) {
        const pdfDoc = gAppState.getPdfDoc();
        if (!pdfDoc || query.length < this._minSearchLength) return;
        
        try {
            gUI.showSpinner();
            
            // 重置搜索匹配项
            this._searchMatches = [];
            this._currentMatchIndex = -1;
            
            // 遍历所有页面搜索匹配
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                // 获取页面文本内容
                const pageTextContent = await gPageRenderer.getPageTextContent(pageNum);
                if (!pageTextContent || !pageTextContent.textItems) continue;
                
                // 搜索匹配项
                const { textItems, viewport } = pageTextContent;
                const matchesOnPage = this._findTextMatchesOnPage(query, textItems, viewport, pageNum);
                
                // 添加到总匹配项中
                this._searchMatches = this._searchMatches.concat(matchesOnPage);
            }
            
            // 更新应用状态
            gAppState.setState({
                searchQuery: query,
                searchMatches: this._searchMatches,
                currentMatchIndex: this._searchMatches.length > 0 ? 0 : -1
            });
            
            // 更新UI
            gUI.updateSearchResults(
                this._searchMatches.length > 0 ? 0 : -1, 
                this._searchMatches.length
            );
            
            // 如果有匹配项，跳转到第一个匹配项
            if (this._searchMatches.length > 0) {
                this._currentMatchIndex = 0;
                await this._navigateToMatch(this._searchMatches[0]);
                gUI.showMessage(`找到 ${this._searchMatches.length} 个匹配项`, 'success');
            } else {
                gUI.showMessage('未找到匹配内容', 'info');
            }
            
            gUI.hideSpinner();
        } catch (error) {
            console.error('搜索文本出错:', error);
            gUI.showMessage('搜索出错: ' + error.message, 'error');
            gUI.hideSpinner();
        }
    }

    /**
     * 在页面上查找文本匹配项
     * @private
     * @param {string} query - 搜索查询字符串
     * @param {Array} textItems - 页面的文本项
     * @param {Object} viewport - 页面的视口
     * @param {number} pageNum - 页码
     * @returns {Array} - 匹配项数组
     */
    _findTextMatchesOnPage(query, textItems, viewport, pageNum) {
        const matches = [];
        const queryLower = query.toLowerCase();
        
        textItems.forEach(item => {
            const text = item.str;
            let indexInText = text.toLowerCase().indexOf(queryLower);
            
            while (indexInText !== -1) {
                // 计算匹配项的位置和大小
                const tx = pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform
                );
                
                // 计算字符宽度（假设等宽字体）
                const charWidth = item.width / item.str.length;
                
                // 计算匹配项的Left位置（根据开始索引调整）
                const left = tx[4] + indexInText * charWidth * (tx[0] / tx[3]);
                
                // 计算匹配项的宽度
                const width = query.length * charWidth * (tx[0] / tx[3]);
                
                // 添加匹配项
                matches.push({
                    pageNum,
                    left,
                    top: tx[5] - tx[0], // 顶部位置减去字体大小得到基线位置
                    width,
                    height: tx[0] * 1.2, // 高度稍微大于字体大小
                    text: text.substr(indexInText, query.length)
                });
                
                // 查找下一个匹配项
                indexInText = text.toLowerCase().indexOf(queryLower, indexInText + 1);
            }
        });
        
        return matches;
    }

    /**
     * 导航到下一个匹配项
     */
    async goToNextMatch() {
        if (this._searchMatches.length === 0) return;
        
        // 计算下一个匹配索引
        this._currentMatchIndex = (this._currentMatchIndex + 1) % this._searchMatches.length;
        
        // 更新应用状态
        gAppState.setState({ currentMatchIndex: this._currentMatchIndex });
        
        // 导航到匹配项
        await this._navigateToMatch(this._searchMatches[this._currentMatchIndex]);
        
        // 更新UI
        gUI.updateSearchResults(this._currentMatchIndex, this._searchMatches.length);
    }

    /**
     * 导航到上一个匹配项
     */
    async goToPrevMatch() {
        if (this._searchMatches.length === 0) return;
        
        // 计算上一个匹配索引
        this._currentMatchIndex = (this._currentMatchIndex - 1 + this._searchMatches.length) % this._searchMatches.length;
        
        // 更新应用状态
        gAppState.setState({ currentMatchIndex: this._currentMatchIndex });
        
        // 导航到匹配项
        await this._navigateToMatch(this._searchMatches[this._currentMatchIndex]);
        
        // 更新UI
        gUI.updateSearchResults(this._currentMatchIndex, this._searchMatches.length);
    }

    /**
     * 导航到指定匹配项
     * @private
     * @param {Object} match - 匹配项
     */
    async _navigateToMatch(match) {
        // 如果匹配项不在当前页，先跳转到对应页面
        if (match.pageNum !== gAppState.getPageNum()) {
            await gPageRenderer.renderPage(match.pageNum, true);
        } else {
            // 如果在当前页，只更新搜索高亮
            this.updateSearchMatchesForCurrentPage();
        }
        
        // 滚动到匹配项位置
        this._scrollToMatch(match);
    }

    /**
     * 滚动到匹配项位置
     * @private
     * @param {Object} match - 匹配项
     */
    _scrollToMatch(match) {
        const pdfContainer = document.querySelector('.pdf-container');
        if (!pdfContainer) return;
        
        // 计算匹配项中心位置
        let matchElem;
        
        if (gAppState.getIsDoublePageView()) {
            // 在双页视图中查找匹配元素
            const pageWrappers = document.querySelectorAll('.page-wrapper');
            if (!pageWrappers.length) return;
            
            const pageIndex = match.pageNum === gAppState.getPageNum() ? 0 : 1;
            const pageWrapper = pageWrappers[pageIndex];
            if (!pageWrapper) return;
            
            const textLayer = pageWrapper.querySelector('.page-text-layer');
            if (!textLayer) return;
            
            const matches = textLayer.querySelectorAll('.text-match');
            const matchIndex = Array.from(matches).findIndex(m => 
                parseInt(m.style.left) === match.left && 
                parseInt(m.style.top) === match.top
            );
            
            if (matchIndex !== -1) {
                matchElem = matches[matchIndex];
            }
        } else {
            // 在单页视图中查找匹配元素
            const textLayer = document.getElementById('text-layer');
            if (!textLayer) return;
            
            const matches = textLayer.querySelectorAll('.text-match');
            const matchIndex = Array.from(matches).findIndex(m => 
                parseInt(m.style.left) === match.left && 
                parseInt(m.style.top) === match.top
            );
            
            if (matchIndex !== -1) {
                matchElem = matches[matchIndex];
            }
        }
        
        if (!matchElem) return;
        
        // 获取匹配项的位置
        const matchRect = matchElem.getBoundingClientRect();
        const containerRect = pdfContainer.getBoundingClientRect();
        
        // 计算滚动位置
        const scrollTop = pdfContainer.scrollTop + (matchRect.top + matchRect.height / 2) - 
            (containerRect.top + containerRect.height / 2);
        
        // 平滑滚动到匹配项位置
        pdfContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    /**
     * 更新当前页面的搜索匹配高亮
     */
    updateSearchMatchesForCurrentPage() {
        // 如果没有匹配项，不执行任何操作
        if (this._searchMatches.length === 0) return;
        
        // 清除现有的文本层高亮
        gPageRenderer.clearTextLayer();
        
        const currentPage = gAppState.getPageNum();
        const isDoublePageView = gAppState.getIsDoublePageView();
        const nextPage = currentPage + 1;
        
        // 在相应的文本层中创建匹配高亮
        if (isDoublePageView) {
            // 双页视图模式
            const pageWrappers = document.querySelectorAll('.page-wrapper');
            if (pageWrappers.length < 1) return;
            
            // 左侧页面的匹配项
            const leftPageTextLayer = pageWrappers[0].querySelector('.page-text-layer');
            if (leftPageTextLayer) {
                this._createMatchHighlights(
                    leftPageTextLayer, 
                    this._searchMatches.filter(match => match.pageNum === currentPage)
                );
            }
            
            // 如果有右侧页面，处理右侧页面的匹配项
            if (pageWrappers.length > 1 && nextPage <= gAppState.getPageCount()) {
                const rightPageTextLayer = pageWrappers[1].querySelector('.page-text-layer');
                if (rightPageTextLayer) {
                    this._createMatchHighlights(
                        rightPageTextLayer, 
                        this._searchMatches.filter(match => match.pageNum === nextPage)
                    );
                }
            }
        } else {
            // 单页视图模式
            const textLayer = document.getElementById('text-layer');
            if (textLayer) {
                this._createMatchHighlights(
                    textLayer, 
                    this._searchMatches.filter(match => match.pageNum === currentPage)
                );
            }
        }
    }

    /**
     * 在文本层中创建匹配高亮
     * @private
     * @param {HTMLElement} textLayer - 文本层元素
     * @param {Array} matches - 匹配项数组
     */
    _createMatchHighlights(textLayer, matches) {
        matches.forEach((match, index) => {
            const matchElement = document.createElement('div');
            matchElement.className = 'text-match';
            
            // 设置高亮位置和大小
            matchElement.style.left = `${match.left}px`;
            matchElement.style.top = `${match.top}px`;
            matchElement.style.width = `${match.width}px`;
            matchElement.style.height = `${match.height}px`;
            
            // 标记当前匹配项
            if (this._searchMatches[this._currentMatchIndex] === match) {
                matchElement.classList.add('active');
            }
            
            textLayer.appendChild(matchElement);
        });
    }

    /**
     * 获取当前搜索状态
     * @returns {Object} - 包含搜索状态的对象
     */
    getSearchState() {
        return {
            query: gAppState.getSearchQuery(),
            matchCount: this._searchMatches.length,
            currentMatchIndex: this._currentMatchIndex
        };
    }
}

// 创建单例
const gSearch = new Search();
export default gSearch; 