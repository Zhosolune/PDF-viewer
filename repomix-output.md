This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: css, dist, js, index.html
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
css/styles.css
index.html
js/app.js
js/core/pageRenderer.js
js/core/pdfManager.js
js/core/viewModes.js
js/features/fileLoader.js
js/features/navigation.js
js/features/responsiveLayout.js
js/features/search.js
js/features/stickyControls.js
js/features/zoom.js
js/utils/appState.js
js/utils/eventBus.js
js/utils/eventHandlers.js
js/utils/ui.js
```

# Files

## File: js/features/fileLoader.js
```javascript
/**
 * 文件加载模块
 * 处理PDF文件的选择和拖放功能
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPDFManager from '../core/pdfManager.js';

class FileLoader {
    /**
     * 创建文件加载模块实例
     */
    constructor() {
        this._acceptedFileTypes = ['application/pdf'];
        this._maxFileSizeMB = 100; // 最大文件大小（MB）
        
        // 初始化事件监听
        this._initListeners();
    }

    /**
     * 初始化事件监听
     * @private
     */
    _initListeners() {
        // 添加文件选择按钮事件监听
        const selectFileBtn = document.getElementById('select-file-btn');
        const fileInput = document.getElementById('file-input');
        
        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', this._onFileSelected.bind(this));
        }
        
        // 设置拖放区域
        this._setupDragAndDrop();
    }

    /**
     * 处理文件选择事件
     * @private
     * @param {Event} event - 文件选择事件
     */
    _onFileSelected(event) {
        const fileInput = event.target;
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        this._loadFile(file);
        
        // 重置文件输入框，允许选择相同的文件
        fileInput.value = '';
    }

    /**
     * 设置拖放区域功能
     * @private
     */
    _setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const pdfContainer = document.getElementById('pdf-container');
        
        if (!dropZone || !pdfContainer) return;
        
        // 辅助函数，检查元素是否是另一个元素的子元素
        const isChild = (child, parent) => {
            let node = child;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        };
        
        // 阻止默认行为
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        // 高亮拖放区域
        const highlight = () => {
            dropZone.classList.add('drag-over');
        };
        
        // 取消高亮拖放区域
        const unhighlight = () => {
            dropZone.classList.remove('drag-over');
        };
        
        // 处理拖放的文件
        const handleFiles = (files) => {
            if (files.length === 0) return;
            
            // 只处理第一个文件
            const file = files[0];
            this._loadFile(file);
        };
        
        // 点击拖放区域也触发文件选择
        dropZone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // 设置拖放相关事件
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pdfContainer.addEventListener(eventName, preventDefaults, false);
        });
        
        // 处理拖入事件（高亮拖放区域）
        pdfContainer.addEventListener('dragenter', (e) => {
            if (!isChild(e.target, dropZone)) {
                highlight();
            }
        }, false);
        
        // 处理拖离事件（取消高亮）
        pdfContainer.addEventListener('dragleave', (e) => {
            if (!isChild(e.relatedTarget, pdfContainer)) {
                unhighlight();
            }
        }, false);
        
        // 处理拖放事件（加载文件）
        pdfContainer.addEventListener('drop', (e) => {
            unhighlight();
            handleFiles(e.dataTransfer.files);
        }, false);
    }

    /**
     * 加载PDF文件
     * @private
     * @param {File} file - PDF文件对象
     * @returns {Promise<boolean>} - 加载是否成功
     */
    async _loadFile(file) {
        // 检查文件类型
        if (!this._acceptedFileTypes.includes(file.type)) {
            gUI.showMessage('请选择PDF文件', 'error');
            return false;
        }
        
        // 检查文件大小
        if (file.size > this._maxFileSizeMB * 1024 * 1024) {
            gUI.showMessage(`文件过大，最大支持${this._maxFileSizeMB}MB`, 'error');
            return false;
        }
        
        try {
            gUI.showSpinner();
            
            // 读取文件内容
            const arrayBuffer = await this._readFileAsArrayBuffer(file);
            
            // 加载PDF文档
            const result = await gPDFManager.loadPdfFromArrayBuffer(arrayBuffer, file.name);
            
            if (result.success) {
                gUI.showMessage(`已加载文件: ${file.name}`, 'success');
                return true;
            } else {
                gUI.showMessage(`加载文件失败: ${result.error}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('加载文件错误:', error);
            gUI.showMessage('加载文件错误: ' + error.message, 'error');
            gUI.hideSpinner();
            return false;
        }
    }

    /**
     * 将文件读取为ArrayBuffer
     * @private
     * @param {File} file - 文件对象
     * @returns {Promise<ArrayBuffer>} - 文件内容的ArrayBuffer
     */
    _readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
}

// 创建单例
const gFileLoader = new FileLoader();
export default gFileLoader;
```

## File: js/features/navigation.js
```javascript
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
```

## File: js/features/search.js
```javascript
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
```

## File: js/features/stickyControls.js
```javascript
/**
 * 控制栏吸顶效果模块
 * 负责控制页面滚动时控制栏的吸顶效果
 */

class StickyControls {
    /**
     * 创建StickyControls实例
     */
    constructor() {
        this._controlsElement = null;
        this._headerElement = null;
        this._lastScrollTop = 0;
        this._headerHeight = 0;
        this._scrollHandler = this._handleScroll.bind(this);
        this._resizeHandler = this._handleResize.bind(this);
        this._isSticky = false;
    }

    /**
     * 初始化吸顶效果
     */
    init() {
        this._controlsElement = document.querySelector('.controls');
        this._headerElement = document.querySelector('.header');
        
        if (!this._controlsElement || !this._headerElement) {
            console.error('找不到控制栏或头部元素，无法初始化吸顶效果');
            return;
        }
        
        // 计算头部高度
        this._updateHeaderHeight();
        
        // 添加滚动事件监听
        window.addEventListener('scroll', this._scrollHandler);
        
        // 添加窗口大小改变事件监听，确保头部高度计算正确
        window.addEventListener('resize', this._resizeHandler);
        
        // 初始调用一次以设置初始状态
        this._handleScroll();
        
        console.log('控制栏吸顶效果已初始化');
    }

    /**
     * 清理事件监听
     */
    cleanup() {
        window.removeEventListener('scroll', this._scrollHandler);
        window.removeEventListener('resize', this._resizeHandler);
    }

    /**
     * 更新头部高度
     * @private
     */
    _updateHeaderHeight() {
        this._headerHeight = this._headerElement.offsetHeight;
    }

    /**
     * 处理窗口大小改变事件
     * @private
     */
    _handleResize() {
        this._updateHeaderHeight();
        this._handleScroll();
    }

    /**
     * 处理页面滚动事件
     * @private
     */
    _handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 如果滚动位置小于头部高度，将控制栏恢复正常布局流
        if (scrollTop <= this._headerHeight) {
            // 如果之前是粘性状态，移除sticky类
            if (this._isSticky) {
                this._controlsElement.classList.remove('sticky');
                this._isSticky = false;
            }
        } else {
            // 否则启用粘性定位并添加sticky类
            if (!this._isSticky) {
                this._controlsElement.classList.add('sticky');
                this._isSticky = true;
            }
        }
        
        this._lastScrollTop = scrollTop;
    }
}

// 创建单例
const gStickyControls = new StickyControls();
export default gStickyControls;
```

## File: js/features/zoom.js
```javascript
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
```

## File: js/utils/appState.js
```javascript
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
```

## File: js/utils/eventBus.js
```javascript
/**
 * 简单事件总线，用于模块间通信
 * 允许组件通过发布-订阅模式进行松散耦合的通信
 */
const gEventBus = {
    _events: {},
    
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} - 取消订阅的函数
     */
    subscribe(event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);
        
        // 返回取消订阅的函数
        return () => this.unsubscribe(event, callback);
    },
    
    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 要传递的数据
     */
    publish(event, data) {
        if (!this._events[event]) return;
        this._events[event].forEach(callback => callback(data));
    },
    
    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 要取消的回调函数
     */
    unsubscribe(event, callback) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(cb => cb !== callback);
    }
};

export default gEventBus;
```

## File: js/utils/eventHandlers.js
```javascript
/**
 * 事件处理工具模块
 * 统一管理键盘快捷键等事件
 */
import gEventBus from './eventBus.js';

class EventHandlers {
    /**
     * 创建事件处理工具实例
     */
    constructor() {
        this._keyboardHandler = this._handleKeyboardNavigation.bind(this);
        this._listeners = [];
    }

    /**
     * 初始化事件监听
     */
    init() {
        // 添加键盘事件监听
        document.addEventListener('keydown', this._keyboardHandler);
        this._listeners.push({
            target: document,
            type: 'keydown',
            handler: this._keyboardHandler
        });
    }

    /**
     * 清理所有事件监听
     */
    cleanup() {
        this._listeners.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this._listeners = [];
    }

    /**
     * 处理键盘导航
     * @private
     * @param {KeyboardEvent} event - 键盘事件
     */
    _handleKeyboardNavigation(event) {
        // 如果当前焦点在输入框中，不处理键盘快捷键
        if (
            event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable
        ) {
            // 在页码输入框中按回车键时，触发页码变更事件
            if (event.key === 'Enter' && event.target.id === 'current-page') {
                gEventBus.publish('page-number-input-changed', {
                    value: parseInt(event.target.value, 10)
                });
                event.preventDefault();
            }
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
                // 左方向键：上一页
                gEventBus.publish('navigation-prev-page');
                event.preventDefault();
                break;
                
            case 'ArrowRight':
                // 右方向键：下一页
                gEventBus.publish('navigation-next-page');
                event.preventDefault();
                break;
                
            case 'Home':
                // Home键：第一页
                gEventBus.publish('navigation-first-page');
                event.preventDefault();
                break;
                
            case 'End':
                // End键：最后一页
                gEventBus.publish('navigation-last-page');
                event.preventDefault();
                break;
                
            case '+':
            case '=':
                // + 或 = 键：放大
                gEventBus.publish('zoom-in');
                event.preventDefault();
                break;
                
            case '-':
                // - 键：缩小
                gEventBus.publish('zoom-out');
                event.preventDefault();
                break;
                
            case 'f':
            case 'F':
                // 按F搜索（类似浏览器的Ctrl+F）
                if (event.ctrlKey) {
                    document.getElementById('search-input').focus();
                    event.preventDefault();
                }
                break;
                
            case 'F3':
                // F3：查找下一个
                if (event.shiftKey) {
                    gEventBus.publish('search-prev-match');
                } else {
                    gEventBus.publish('search-next-match');
                }
                event.preventDefault();
                break;
                
            case '0':
                // Ctrl+0：重置缩放
                if (event.ctrlKey) {
                    gEventBus.publish('zoom-reset');
                    event.preventDefault();
                }
                break;
                
            case '1':
                // Ctrl+1：单页视图
                if (event.ctrlKey) {
                    gEventBus.publish('view-mode-single');
                    event.preventDefault();
                }
                break;
                
            case '2':
                // Ctrl+2：双页视图
                if (event.ctrlKey) {
                    gEventBus.publish('view-mode-double');
                    event.preventDefault();
                }
                break;
        }
    }
}

// 创建单例
const gEventHandlers = new EventHandlers();
export default gEventHandlers;
```

## File: js/core/viewModes.js
```javascript
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
        
        // 在切换视图前清除所有文本层
        gPageRenderer.clearTextLayer();
        
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
        
        // 在切换视图前清除所有文本层
        gPageRenderer.clearTextLayer();
        
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
```

## File: js/features/responsiveLayout.js
```javascript
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
```

## File: js/utils/ui.js
```javascript
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
```

## File: js/app.js
```javascript
/**
 * 应用程序入口
 * 负责初始化和组织各模块
 */
import gEventBus from './utils/eventBus.js';
import gAppState from './utils/appState.js';
import gUI from './utils/ui.js';
import gEventHandlers from './utils/eventHandlers.js';
import gPDFManager from './core/pdfManager.js';
import gPageRenderer from './core/pageRenderer.js';
import gViewModes from './core/viewModes.js';
import gNavigation from './features/navigation.js';
import gZoom from './features/zoom.js';
import gSearch from './features/search.js';
import gFileLoader from './features/fileLoader.js';
import gResponsiveLayout from './features/responsiveLayout.js';
import gStickyControls from './features/stickyControls.js';

/**
 * 初始化应用程序
 */
function initApp() {
    console.log('初始化PDF查看器应用');
    
    try {
        // 初始化PDF.js库
        const pdfInitialized = gPDFManager.init();
        if (!pdfInitialized) {
            console.error('PDF.js初始化失败');
            return;
        }
        
        // 初始化键盘事件处理
        gEventHandlers.init();
        
        // 初始化控制栏吸顶效果
        gStickyControls.init();
        
        // 显示欢迎消息
        gUI.showMessage('PDF查看器已准备就绪', 'success');
        
        // 发布应用初始化完成事件
        gEventBus.publish('app-initialized');
    } catch (error) {
        console.error('应用初始化错误:', error);
        gUI.showMessage('应用初始化错误: ' + error.message, 'error');
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 提供给外部使用的API
window.PDFViewer = {
    loadPDF: async (arrayBuffer, filename) => {
        return await gPDFManager.loadPdfFromArrayBuffer(arrayBuffer, filename);
    },
    closePDF: async () => {
        return await gPDFManager.closePdf();
    },
    goToPage: (pageNum) => {
        gNavigation.goToPage({ value: pageNum });
    },
    setZoom: (scale) => {
        gZoom.setZoom(scale);
    },
    search: (query) => {
        gSearch.searchText(query);
    },
    adjustLayout: () => {
        gResponsiveLayout._adjustLayout();
    }
};
```

## File: js/core/pdfManager.js
```javascript
/**
 * PDF文档管理模块
 * 负责初始化PDF.js和管理PDF文档
 */
import gEventBus from '../utils/eventBus.js';
import gAppState from '../utils/appState.js';
import gUI from '../utils/ui.js';
import gPageRenderer from './pageRenderer.js';  // 导入页面渲染器

class PDFManager {
    /**
     * 创建PDF管理器实例
     */
    constructor() {
        this._pdfDoc = null;
        this._initialized = false;
    }

    /**
     * 初始化PDF.js库
     */
    init() {
        // 确保pdfjsLib已加载
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js库未正确加载，请检查引用');
            gUI.showMessage('PDF.js库未正确加载，请刷新页面重试', 'error');
            return false;
        }
        
        try {
            // 设置worker路径
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            console.log('PDF.js Worker设置完成');
            this._initialized = true;
            return true;
        } catch (error) {
            console.error('PDF.js初始化错误:', error);
            gUI.showMessage('PDF.js初始化错误: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 从ArrayBuffer加载PDF文档
     * @param {ArrayBuffer} arrayBuffer - PDF文件的ArrayBuffer
     * @param {string} filename - 文件名
     * @returns {Promise<Object>} - 加载结果对象
     */
    async loadPdfFromArrayBuffer(arrayBuffer, filename) {
        // 确保PDF.js已初始化
        if (!this._initialized && !this.init()) {
            return { success: false, error: 'PDF.js未初始化' };
        }
        
        try {
            gUI.showSpinner();
            console.log(`开始加载PDF文件: ${filename}`);
            
            // 重置渲染状态和缓存
            this._resetState();
            
            // 清除现有的PDF文档
            if (this._pdfDoc) {
                console.log('清除现有PDF文档');
                await this._pdfDoc.destroy();
                this._pdfDoc = null;
            }
            
            // 加载PDF文档
            console.log('初始化PDF加载任务');
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            
            // 更新UI显示文件名
            gUI.updatePdfFilename(filename);
            
            // 等待加载完成
            console.log('等待PDF文档加载完成');
            this._pdfDoc = await loadingTask.promise;
            console.log(`PDF文档加载完成，共${this._pdfDoc.numPages}页`);
            
            // 更新应用状态
            gAppState.setState({
                pdfDoc: this._pdfDoc,
                pageCount: this._pdfDoc.numPages,
                pageNum: 1,
                currentFilename: filename,
                scale: gAppState.getDefaultScale(),
                isDoublePageView: false
            });
            
            // 更新UI
            gUI.updateUIForPdfLoaded(this._pdfDoc.numPages);
            
            // 直接调用渲染方法显示第一页
            try {
                console.log('开始渲染PDF首页');
                await gPageRenderer.renderPage(1);
                console.log('PDF首页渲染完成');
            } catch (renderError) {
                console.error('渲染PDF首页错误:', renderError);
                // 即使渲染失败也继续，不影响PDF加载结果
            }
            
            gUI.hideSpinner();
            
            // 发布PDF加载完成事件
            gEventBus.publish('pdf-loaded', {
                pdfDoc: this._pdfDoc,
                pageCount: this._pdfDoc.numPages,
                filename
            });
            
            return {
                success: true,
                pageCount: this._pdfDoc.numPages,
                pdfDoc: this._pdfDoc
            };
        } catch (error) {
            console.error('加载PDF文档错误:', error);
            gUI.showMessage('加载PDF文档错误: ' + error.message, 'error');
            gUI.hideSpinner();
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 重置状态和清除缓存
     * @private
     */
    _resetState() {
        console.log('重置PDF管理器状态和缓存');
        
        // 重置应用状态
        gAppState.resetState();
        
        // 清除文本层
        gPageRenderer.clearTextLayer();
        
        // 清除页面文本内容缓存
        gPageRenderer.clearPageTextContent();
        
        // 清除DOM中可能存在的残留元素
        this._cleanupDOM();
    }
    
    /**
     * 清理DOM中的残留元素
     * @private
     */
    _cleanupDOM() {
        // 清理隐藏的canvas元素
        const hiddenCanvas = document.querySelector('#pdf-viewer[style*="display: none"]');
        if (hiddenCanvas && hiddenCanvas.parentNode) {
            console.log('移除隐藏的canvas元素');
            hiddenCanvas.parentNode.removeChild(hiddenCanvas);
        }
        
        // 获取canvas容器
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            // 保存现有canvas，如果存在的话
            const existingCanvas = document.getElementById('pdf-viewer');
            let savedCanvas = null;
            
            if (existingCanvas && canvasContainer.contains(existingCanvas)) {
                console.log('保存现有canvas元素');
                savedCanvas = existingCanvas;
                canvasContainer.removeChild(existingCanvas);
            }
            
            // 清空canvas容器
            console.log('清空canvas容器');
            canvasContainer.innerHTML = '';
            canvasContainer.className = 'canvas-container';
            
            // 如果之前存在canvas，重新添加
            if (savedCanvas) {
                console.log('重新添加保存的canvas元素');
                canvasContainer.appendChild(savedCanvas);
            } else {
                // 创建新的canvas元素
                console.log('创建新的canvas元素');
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'pdf-viewer';
                newCanvas.className = 'page-canvas';
                canvasContainer.appendChild(newCanvas);
            }
            
            // 创建文本层
            console.log('创建新的文本层');
            const textLayer = document.createElement('div');
            textLayer.id = 'text-layer';
            textLayer.className = 'text-layer';
            canvasContainer.appendChild(textLayer);
        } else {
            console.error('找不到canvas容器元素');
        }
    }

    /**
     * 关闭当前PDF文档
     */
    async closePdf() {
        try {
            if (this._pdfDoc) {
                await this._pdfDoc.destroy();
                this._pdfDoc = null;
                
                // 更新应用状态
                gAppState.resetState();
                
                // 更新UI
                gUI.updateUIForNoPdf();
                gUI.updatePdfFilename(null);
                
                // 发布PDF关闭事件
                gEventBus.publish('pdf-closed');
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('关闭PDF文档错误:', error);
            return false;
        }
    }

    /**
     * 获取指定页面
     * @param {number} pageNum - 页码
     * @returns {Promise<Object>} - 页面对象
     */
    async getPage(pageNum) {
        if (!this._pdfDoc) {
            throw new Error('没有加载PDF文档');
        }
        
        try {
            return await this._pdfDoc.getPage(pageNum);
        } catch (error) {
            console.error(`获取第${pageNum}页出错:`, error);
            throw error;
        }
    }

    /**
     * 获取当前PDF文档
     * @returns {Object} - PDF文档对象
     */
    getPdfDoc() {
        return this._pdfDoc;
    }

    /**
     * 获取总页数
     * @returns {number} - 总页数
     */
    getPageCount() {
        return this._pdfDoc ? this._pdfDoc.numPages : 0;
    }
}

// 创建单例
const gPDFManager = new PDFManager();
export default gPDFManager;
```

## File: js/core/pageRenderer.js
```javascript
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
     * 计算最佳缩放比例，使PDF内容适应窗口大小
     * @param {Object} page - PDF页面对象
     * @returns {number} - 计算得到的最佳缩放比例
     * @private
     */
    _calculateBestScale(page) {
        // 获取当前设置的缩放比例
        const currentScale = gAppState.getScale();
        
        // 获取用户是否手动设置了缩放
        const defaultScale = gAppState.getDefaultScale();
        const hasUserSetScale = Math.abs(currentScale - defaultScale) > 0.01;
        
        // 如果用户手动设置了缩放，直接返回用户设置的缩放比例
        if (hasUserSetScale) {
            return currentScale;
        }
        
        // 获取PDF容器尺寸
        const pdfContainer = document.getElementById('pdf-container');
        if (!pdfContainer) return currentScale;
        
        // 考虑容器内边距
        const containerPadding = 40; // 左右各20px内边距
        const availableWidth = pdfContainer.clientWidth - containerPadding;
        
        // 获取页面原始视口
        const originalViewport = page.getViewport({ scale: 1.0 });
        
        // 计算水平方向上的缩放比例
        // 在双页视图中，宽度需要考虑两个页面并排显示
        const isDoublePageView = gAppState.getIsDoublePageView();
        let horizontalScale = availableWidth / originalViewport.width;
        
        if (isDoublePageView) {
            // 双页视图时考虑间隙
            horizontalScale = horizontalScale / 1.5; // 使用1.5作为因子考虑两页之间的间隙
        }
        
        // 设置最小和最大缩放限制
        const minScale = 0.5;  // 最小缩放为50%
        const maxScale = 2.0;  // 最大缩放为200%
        
        // 确保缩放比例在合理范围内，但只限制最小值
        // 不限制最大值，允许用户根据需要放大
        let bestScale = Math.max(minScale, horizontalScale);
        
        // 如果超出最大值，也不限制
        // bestScale = Math.min(bestScale, maxScale);
        
        console.log(`计算最佳缩放比例: 
            - 当前缩放: ${currentScale}
            - 可用宽度: ${availableWidth}px
            - 页面原始宽度: ${originalViewport.width}px
            - 水平缩放: ${horizontalScale.toFixed(2)}
            - 最佳缩放: ${bestScale.toFixed(2)}
            - 用户是否设置缩放: ${hasUserSetScale}`);
        
        return bestScale;
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
            
            // 计算最佳缩放比例
            const bestScale = this._calculateBestScale(page);
            
            // 如果计算得到的最佳缩放比例与当前不同，则更新应用状态
            const currentScale = gAppState.getScale();
            if (Math.abs(bestScale - currentScale) > 0.01) {
                gAppState.setState({ scale: bestScale });
                gUI.updateZoomDisplay(bestScale);
            }
            
            // 使用计算后的缩放创建视口
            const viewport = page.getViewport({ scale: bestScale });
            
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
```

## File: index.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF预览器</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.12.2/reset.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <!-- 消息通知组件 -->
        <div id="message" class="message">
            <div class="message-content"></div>
        </div>
        
        <div class="header">
            <h1 class="title">PDF预览器 v1.0.0</h1>
            <div class="file-info">
                <div class="btn-group">
                    <button id="select-file-btn" class="btn btn-primary">选择PDF文件</button>
                    <input type="file" id="file-input" accept="application/pdf" style="display: none;">
                </div>
                <div class="pdf-filename" id="pdf-filename">未选择文件</div>
            </div>
        </div>

        <div class="controls">
            <button class="btn" id="prev-page" title="上一页 (左方向键)">
                <span class="anticon"><svg viewBox="64 64 896 896" focusable="false" data-icon="left" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path></svg></span> <span class="btn-text">上一页</span>
            </button>
            <div class="input-group">
                <input type="number" class="input-number" id="current-page" value="1" min="1" title="输入页码并按回车跳转" />
                <span class="page-info">/ <span id="page-count">0</span></span>
            </div>
            <button class="btn" id="next-page" title="下一页 (右方向键)">
                <span class="btn-text">下一页</span> <span class="anticon"><svg viewBox="64 64 896 896" focusable="false" data-icon="right" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path></svg></span>
            </button>
            <div class="zoom-control">
                <button class="btn" id="zoom-out" title="缩小 (-键)">
                    <span class="anticon"><svg viewBox="64 64 896 896" focusable="false" data-icon="minus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"></path></svg></span>
                    <span class="btn-text">缩小</span>
                </button>
                <span class="page-info" id="zoom-reset" title="重置缩放 (Ctrl+0)" style="cursor: pointer;"><span id="zoom-level">100</span>%</span>
                <button class="btn" id="zoom-in" title="放大 (+键)">
                    <span class="anticon"><svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg></span>
                    <span class="btn-text">放大</span>
                </button>
            </div>
            <div class="view-mode-control">
                <button class="btn" id="single-page-view" title="单页视图 (Ctrl+1)">
                    <span class="anticon"><i class="fas fa-file-alt"></i></span> <span class="btn-text">单页</span>
                </button>
                <button class="btn" id="double-page-view" title="双页视图 (Ctrl+2)">
                    <span class="anticon"><i class="fas fa-book-open"></i></span> <span class="btn-text">双页</span>
                </button>
            </div>
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="搜索文本" title="按Ctrl+F聚焦 (最少2个字符)" />
                <button id="search-prev" class="btn" title="上一个匹配 (Shift+F3)">
                    <i class="fas fa-chevron-up"></i><span class="btn-text">上一个</span>
                </button>
                <button id="search-next" class="btn" title="下一个匹配 (F3)">
                    <i class="fas fa-chevron-down"></i><span class="btn-text">下一个</span>
                </button>
                <button id="search-clear" class="btn" title="清除搜索">
                    <i class="fas fa-times"></i><span class="btn-text">清除</span>
                </button>
                <span id="search-results" class="search-results"></span>
            </div>
        </div>
        
        <div id="pdf-container" class="pdf-container">
            <div id="spinner" class="spinner">
                <div class="double-bounce1"></div>
                <div class="double-bounce2"></div>
            </div>
            <div class="canvas-container" id="canvas-container">
                <canvas id="pdf-viewer"></canvas>
                <div id="text-layer" class="text-layer"></div>
            </div>
            <div id="drop-zone" class="drop-zone">
                <div class="drop-zone-hint">
                    <i class="fas fa-file-pdf"></i>
                    <p>拖放PDF文件到此处，或点击选择文件</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 使用本地PDF.js库 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 设置worker路径
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    </script>
    <!-- 引用应用程序入口 -->
    <script type="module" src="js/app.js"></script>
</body>
</html>
```

## File: css/styles.css
```css
:root {
    --primary-color: #1890ff;
    --success-color: #52c41a;
    --warning-color: #faad14;
    --error-color: #f5222d;
    --font-size-base: 14px;
    --border-radius-base: 2px;
    --controls-height: 64px;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f2f5;
    color: rgba(0, 0, 0, 0.85);
}
h1 {
    text-align: center;
}

.container {
    max-width: 100%;
    margin: 0 auto;
    padding: 24px;
}

.header {
    background-color: #fff;
    padding: 16px 24px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    flex-direction: column;
    margin-bottom: 24px;
    border-radius: 2px;
}

.title {
    font-size: 20px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    margin: 0;
    margin-bottom: 16px;
}

.file-info {
    display: flex;
    align-items: center;
    width: 100%;
}

.btn-group {
    display: flex;
    align-items: center;
}

.controls {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 20px;
    background-color: #fff;
    padding: 16px;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    position: sticky;
    top: 0;
    z-index: 100;
    transition: top 0.3s, box-shadow 0.3s;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    justify-content: center;
    flex-wrap: wrap;
}

/* 确保按钮组之间有适当间距 */
.zoom-control, .view-mode-control, .search-bar {
    margin: 0 5px;
}

/* 增加控制栏在固定状态下的样式 */
.controls.sticky {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.controls.hidden {
    top: -100px;
}

.btn {
    padding: 4px 15px;
    border: 1px solid #d9d9d9;
    border-radius: var(--border-radius-base);
    background-color: #fff;
    color: rgba(0, 0, 0, 0.85);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
}

.btn:hover {
    color: var(--primary-color);
    border-color: var(--primary-color);
}

.btn:active {
    color: #096dd9;
    border-color: #096dd9;
}

.btn::after {
    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
    background-repeat: no-repeat;
    background-position: 50%;
    transform: scale(10, 10);
    opacity: 0;
    transition: transform .3s, opacity .5s;
}

.btn:active::after {
    transform: scale(0, 0);
    opacity: .3;
    transition: 0s;
}

.btn-primary {
    color: #fff;
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.btn-primary:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
    color: #fff;
}

.btn-primary:active {
    background-color: #096dd9;
    border-color: #096dd9;
}

.input-group {
    display: flex;
    align-items: center;
    margin-right: 10px;
}

.page-info {
    margin: 0 16px;
    white-space: nowrap;
}

.input-number {
    width: 70px;
    height: 32px;
    padding: 4px 11px;
    border: 1px solid #d9d9d9;
    border-radius: var(--border-radius-base);
    transition: all 0.3s;
    text-align: center;
}

.input-number:hover {
    border-color: var(--primary-color);
}

.input-number:focus {
    border-color: #40a9ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.zoom-control {
    display: flex;
    align-items: center;
    margin-right: 20px;
}

.view-mode-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pdf-container {
    background-color: #f5f5f5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    border-radius: 2px;
    overflow: auto;
    min-height: calc(100vh - 150px);
    height: auto;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    position: relative;
}

.drop-zone {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 600px;
    height: 300px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(250, 250, 250, 0.8);
    transition: all 0.3s ease;
    z-index: 2;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    will-change: transform, border-color, background-color;
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
}

.drop-zone:hover {
    border-color: #40a9ff;
    background-color: rgba(240, 245, 255, 0.8);
}

.drop-zone.active {
    border-color: var(--success-color);
    background-color: rgba(245, 255, 240, 0.8);
    box-shadow: 0 0 0 4px rgba(82, 196, 26, 0.1);
}

.drop-zone.drag-over {
    border-color: var(--primary-color);
    background-color: rgba(230, 247, 255, 0.8);
    border-width: 3px;
    box-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.drop-zone.drag-over {
    animation: none;
}

.pdf-container.has-pdf .drop-zone {
    display: none;
}

.drop-zone-prompt {
    margin-top: 80px;
    font-size: 18px;
    color: #8c8c8c;
    text-align: center;
}

.drop-zone-icon {
    width: 80px;
    height: 80px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath fill='%23d9d9d9' d='M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm250.2-143.7c-12.2-12-47-8.7-64.4-6.5-17.2-10.5-28.7-25-36.8-46.3 3.9-16.1 10.1-40.6 5.4-56-4.2-26.2-37.8-23.6-42.6-5.9-4.4 16.1-.4 38.5 7 67.1-10 23.9-24.9 56-35.4 74.4-20 10.3-47 26.2-51 46.2-3.3 15.8 26 55.2 76.1-31.2 22.4-7.4 46.8-16.5 68.4-20.1 18.9 10.2 41 17 55.8 17 25.5 0 28-28.2 17.5-38.7zm-198.1 77.8c5.1-13.7 24.5-29.5 30.4-35-19 30.3-30.4 35.7-30.4 35zm81.6-190.6c7.4 0 6.7 32.1 1.8 40.8-4.4-13.9-4.3-40.8-1.8-40.8zm-24.4 136.6c9.7-16.9 18-37 24.7-54.7 8.3 15.1 18.9 27.2 30.1 35.5-20.8 4.3-38.9 13.1-54.8 19.2zm131.6-5s-5 6-37.3-7.8c35.1-2.6 40.9 5.4 37.3 7.8z'%3E%3C/path%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    margin-bottom: 20px;
}

.pdf-container::before,
.pdf-container::after {
    display: none;
}

.drop-zone-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.drop-zone-hint p {
    font-size: 16px;
    color: #595959;
    margin-top: 15px;
}

.canvas-container {
    position: relative;
    margin: 0 auto;
    min-height: 400px;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-width: none;
}

/* 多页视图相关样式 */
.canvas-container.double-view {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.page-wrapper {
    position: relative;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.page-canvas {
    display: block;
}

.page-text-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    line-height: 1;
    pointer-events: none;
    z-index: 2;
}

.view-mode-control .btn.active {
    color: var(--primary-color);
    border-color: var(--primary-color);
    background-color: rgba(24, 144, 255, 0.1);
}

#pdf-viewer {
    display: none;
    z-index: 1;
}

#pdf-viewer.active {
    display: block;
    animation: fadeIn 0.3s ease-in-out;
}

.text-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    line-height: 1;
    pointer-events: none;
    z-index: 2;
}

.file-selector {
    position: relative;
    overflow: hidden;
}

.file-selector input[type="file"] {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 100%;
    min-height: 100%;
    opacity: 0;
    cursor: pointer;
}

/* Loading Spinner */
.spinner {
    display: none;
    width: 40px;
    height: 40px;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -20px;
    margin-left: -20px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid var(--primary-color);
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Message styles */
.message {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    max-width: 80%;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08);
}

.message.show {
    opacity: 1;
}

.message-info {
    background: rgba(0, 0, 0, 0.75);
}

.message-success {
    background: rgba(82, 196, 26, 0.85);
}

.message-error {
    background: rgba(255, 77, 79, 0.85);
}

.anticon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: inherit;
}

.anticon svg {
    display: inline-block;
    line-height: 0;
}

/* 响应式设计 */
@media (max-width: 1280px) {
    /* 首先隐藏搜索按钮的文字 */
    .search-bar .btn .btn-text {
        display: none !important;
        width: 0;
        height: 0;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
    }
}

@media (max-width: 1100px) {
    /* 隐藏导航按钮的文字 */
    #prev-page .btn-text, #next-page .btn-text {
        display: none !important;
        width: 0;
        height: 0;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
    }
}

@media (max-width: 960px) {
    /* 隐藏缩放和视图模式按钮的文字 */
    .zoom-control .btn .btn-text, 
    .view-mode-control .btn .btn-text {
        display: none !important;
        width: 0;
        height: 0;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
    }
    
    .container {
        padding: 16px;
        max-width: 100%;
    }
    
    .header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }
    
    .controls {
        gap: 12px; /* 减小按钮之间的间距 */
    }
    
    .search-bar {
        margin-top: 10px;
        justify-content: flex-start;
        flex: 0 0 auto; /* 防止搜索栏拉伸或压缩 */
    }
}

@media (max-width: 780px) {
    .controls {
        gap: 8px; /* 进一步减小间距 */
        padding: 12px; /* 减小内边距 */
    }
    
    .search-bar {
        flex-basis: 100%; /* 让搜索栏占据整行 */
        justify-content: center;
    }
    
    /* 保留搜索框的宽度适当值 */
    .search-bar input {
        width: 120px;
    }
    
    .zoom-control, .view-mode-control {
        margin: 0 4px; /* 减小边距 */
    }
    
    .page-info {
        margin: 0 8px; /* 适当调整页码信息的边距 */
    }
}

@media (max-width: 480px) {
    .input-number {
        width: 40px;
    }
    
    .page-info {
        margin: 0 5px;
    }
    
    .btn {
        padding: 4px 6px;
        font-size: 12px;
        min-width: 28px !important; /* 覆盖之前设定的最小宽度 */
    }
    
    .controls {
        padding: 10px 5px;
        gap: 5px;
    }
    
    .search-bar {
        margin-top: 5px;
        display: flex;
        justify-content: center;
    }
    
    .search-bar input {
        width: 80px;
    }
    
    .search-bar .btn {
        padding: 4px 5px;
        min-width: 24px !important;
    }
    
    /* 在超小屏幕时减小控件间距 */
    .zoom-control, .view-mode-control {
        gap: 2px;
        margin: 0 2px;
    }
}

/* 打印样式 */
@media print {
    .header, .controls, .message {
        display: none;
    }
    
    .container {
        padding: 0;
        max-width: 100%;
    }
    
    .pdf-container {
        height: auto;
        overflow: visible;
        box-shadow: none;
        padding: 0;
    }
    
    #pdf-viewer {
        box-shadow: none;
    }
}

/* 添加CSS动画效果 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
}

#pdf-viewer.active {
    position: relative;
    display: block;
    animation: fadeIn 0.3s ease-in-out;
}

/* 确保PDF容器在缩放时正确对齐 */
.pdf-container.has-pdf {
    padding: 20px;
    background-color: #f5f5f5;
    height: auto;
    min-height: calc(100vh - 150px);
}

/* 更新文本匹配高亮样式 */
.text-match {
    position: absolute;
    background-color: rgba(255, 255, 0, 0.4);
    border-radius: 2px;
    pointer-events: none;
    mix-blend-mode: multiply;
    box-sizing: border-box;
}

.text-match.active {
    background-color: rgba(255, 165, 0, 0.7);
    box-shadow: 0 0 5px 2px rgba(255, 165, 0, 0.3);
}

/* 在有PDF时隐藏拖放区域 */
.pdf-container.has-pdf .drop-zone {
    display: none;
}

/* 确保spinner正确居中 */
#spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

/* 文件名显示样式 */
.pdf-filename {
    flex: 1;
    margin: 0 15px;
    font-size: 16px;
    color: #333;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 0 8px;
}

/* 搜索栏样式 */
.search-bar {
    display: flex;
    align-items: center;
    position: relative;
}

.search-bar input {
    height: 32px;
    padding: 5px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    width: 180px;
}

.search-bar input:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-bar button {
    margin-left: 5px;
    padding: 4px 8px;
    font-size: 12px;
    min-width: 32px;
}

.search-results {
    margin-left: 8px;
    font-size: 12px;
    color: #666;
    min-width: 40px;
}

.top-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 0 10px;
}

.search-bar {
    display: flex;
    align-items: center;
    position: relative;
}

.search-bar input {
    height: 32px;
    padding: 5px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    width: 180px;
}

.search-bar input:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-bar button {
    margin-left: 5px;
    padding: 4px 8px;
    font-size: 12px;
}

.search-results {
    margin-left: 8px;
    font-size: 12px;
    color: #666;
    min-width: 40px;
}

.text-match {
    position: absolute;
    background-color: rgba(255, 255, 0, 0.4);
    border-radius: 2px;
    pointer-events: none;
    mix-blend-mode: multiply;
}

.text-match.active {
    background-color: rgba(255, 165, 0, 0.7);
    box-shadow: 0 0 5px 2px rgba(255, 165, 0, 0.3);
}

/* 增大拖放区域图标 */
.drop-zone .fa-file-pdf {
    font-size: 64px;
    color: #1890ff;
    margin-bottom: 20px;
}

/* 确保PDF容器相对定位以便文本层定位正确 */
#pdf-container {
    position: relative;
}

#pdf-viewer, #text-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
}

#pdf-viewer.active {
    position: relative;
    display: block;
    animation: fadeIn 0.3s ease-in-out;
}

/* 添加新的平滑过渡动画 */
@keyframes gentle-pulsate {
    0% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.3);
    }
    50% {
        transform: translate(-50%, -50%) scale(1.02);
        box-shadow: 0 0 10px 0 rgba(24, 144, 255, 0.5);
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.3);
    }
}

.drop-zone.drag-over {
    animation: gentle-pulsate 2s infinite ease-in-out;
}

#zoom-reset {
    user-select: none;
    transition: all 0.3s;
}

#zoom-reset:hover {
    color: var(--primary-color);
    transform: scale(1.05);
}

#zoom-reset:active {
    transform: scale(0.95);
}

/* 按钮文字类 */
.btn-text {
    display: inline-block !important;
}

/* 设置按钮的最小宽度，确保图标可见 */
#prev-page, #next-page {
    min-width: 32px; /* 减小最小宽度，避免溢出 */
}

#zoom-in, #zoom-out {
    min-width: 32px;
}

#single-page-view, #double-page-view {
    min-width: 32px; /* 减小最小宽度，避免溢出 */
}

/* 搜索栏按钮样式 */
.search-bar .btn {
    min-width: 32px;
    padding: 4px 8px;
}
```
