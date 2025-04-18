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