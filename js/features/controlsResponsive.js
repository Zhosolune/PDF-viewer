/**
 * 控制栏响应式设计模块
 * 负责根据控制栏宽度动态调整按钮显示方式
 * 实现多级响应式设计：
 * 1. 控制栏宽度小于按钮总宽度时，隐藏所有按钮文字只显示图标
 * 2. 宽度进一步减小时，切换回显示文字按钮但不换行
 * 3. 宽度比换行后按钮总宽度还小时，再次隐藏文字只显示图标
 * 4. 若更窄，则缩小按钮尺寸
 */
import gEventBus from '../utils/eventBus.js';

class ControlsResponsive {
    /**
     * 创建控制栏响应式设计管理器实例
     */
    constructor() {
        this._controlsElement = null;
        this._buttons = null;
        this._resizeObserver = null;
        this._buttonsFullWidth = 0;
        this._buttonsIconOnlyWidth = 0;
        this._buttonsCompactWidth = 0;
        this._currentMode = 'full'; // 'full', 'icons', 'compact', 'compact-icons', 'mini'
    }

    /**
     * 初始化控制栏响应式设计
     */
    init() {
        console.log('初始化控制栏响应式设计...');
        
        this._controlsElement = document.querySelector('.controls');
        if (!this._controlsElement) {
            console.error('找不到控制栏元素，无法初始化响应式设计');
            return;
        }

        // 获取所有按钮元素
        this._buttons = this._controlsElement.querySelectorAll('.btn');
        console.log(`找到 ${this._buttons.length} 个按钮元素`);
        
        // 创建ResizeObserver监听控制栏大小变化
        this._resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this._controlsElement) {
                    const width = entry.contentRect.width;
                    console.log(`控制栏宽度变化: ${width}px`);
                    this._handleControlsResize(width);
                }
            }
        });
        
        // 开始观察控制栏大小变化
        this._resizeObserver.observe(this._controlsElement);
        
        // 监听窗口大小变化事件，重新计算按钮宽度（添加防抖处理）
        this._resizeHandler = this._debounce(() => {
            console.log('窗口大小变化，重新计算按钮宽度');
            this._calculateButtonWidths();
        }, 300); // 300ms防抖
        window.addEventListener('resize', this._resizeHandler);
        
        // 初始计算按钮宽度
        this._calculateButtonWidths();
        
        // 初始调整一次布局
        setTimeout(() => {
            const initialWidth = this._controlsElement.offsetWidth;
            console.log(`控制栏初始宽度: ${initialWidth}px`);
            this._handleControlsResize(initialWidth);
        }, 100);
        
        // 监听视图模式变化，重新计算宽度
        this._viewModeChangeHandler = this._debounce(() => {
            console.log('视图模式变化，重新计算按钮宽度');
            this._calculateButtonWidths();
        }, 300);
        gEventBus.subscribe('view-mode-changed', this._viewModeChangeHandler);
        
        // 监听PDF加载完成，重新计算宽度
        this._pdfLoadedHandler = this._debounce(() => {
            console.log('PDF加载完成，重新计算按钮宽度');
            this._calculateButtonWidths();
        }, 300);
        gEventBus.subscribe('pdf-loaded', this._pdfLoadedHandler);
        
        console.log('控制栏响应式设计已初始化');
    }

    /**
     * 计算按钮在不同模式下的总宽度
     * @private
     */
    _calculateButtonWidths() {
        console.log('开始计算按钮宽度...');
        
        // 记住当前模式，以便后续恢复
        const currentMode = this._currentMode;
        
        // 创建一个隐藏的容器克隆，用于测量，避免频繁改变可见元素导致闪烁
        const tempContainer = this._controlsElement.cloneNode(true);
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.pointerEvents = 'none';
        tempContainer.style.width = `${this._controlsElement.offsetWidth}px`;
        document.body.appendChild(tempContainer);
        
        // 获取克隆容器中的按钮
        const tempButtons = tempContainer.querySelectorAll('.btn');
        
        // 测量完整模式（显示文字）下的总宽度
        this._measureButtonsWidth(tempContainer, tempButtons, 'full').then(fullWidth => {
            // 记录完整模式宽度
            this._buttonsFullWidth = fullWidth;
            console.log(`完整模式总宽度: ${this._buttonsFullWidth}px`);
            
            // 测量仅图标模式的总宽度
            return this._measureButtonsWidth(tempContainer, tempButtons, 'icons');
        }).then(iconsWidth => {
            // 记录仅图标模式宽度
            this._buttonsIconOnlyWidth = iconsWidth;
            console.log(`仅图标模式总宽度: ${this._buttonsIconOnlyWidth}px`);
            
            // 测量紧凑模式（文字但不换行）的总宽度
            return this._measureButtonsWidth(tempContainer, tempButtons, 'compact');
        }).then(compactWidth => {
            // 记录紧凑模式宽度
            this._buttonsCompactWidth = compactWidth;
            console.log(`紧凑模式总宽度: ${this._buttonsCompactWidth}px`);
            
            // 移除临时容器
            document.body.removeChild(tempContainer);
            
            console.log(`按钮宽度计算完成: 
                - 完整模式: ${this._buttonsFullWidth}px
                - 仅图标模式: ${this._buttonsIconOnlyWidth}px
                - 紧凑模式: ${this._buttonsCompactWidth}px
            `);
            
            // 根据当前控制栏宽度应用合适的模式
            this._handleControlsResize(this._controlsElement.offsetWidth);
        }).catch(error => {
            console.error('计算按钮宽度时发生错误:', error);
        });
    }
    
    /**
     * 在指定模式下测量按钮宽度
     * @private
     * @param {HTMLElement} container - 容器元素
     * @param {NodeList} buttons - 按钮元素集合
     * @param {string} mode - 模式名称 ('full', 'icons', 'compact')
     * @returns {Promise<number>} 总宽度
     */
    _measureButtonsWidth(container, buttons, mode) {
        return new Promise(resolve => {
            // 移除所有模式类
            ['full', 'icons', 'compact', 'compact-icons', 'mini'].forEach(m => {
                container.classList.remove(`controls-mode-${m}`);
            });
            
            // 添加当前要测量的模式类
            container.classList.add(`controls-mode-${mode}`);
            
            // 等待样式应用
            setTimeout(() => {
                let totalWidth = 0;
                // 测量每个按钮的宽度和外边距
                buttons.forEach(btn => {
                    const style = window.getComputedStyle(btn);
                    const width = btn.offsetWidth;
                    const marginLeft = parseFloat(style.marginLeft);
                    const marginRight = parseFloat(style.marginRight);
                    totalWidth += width + marginLeft + marginRight;
                });
                resolve(totalWidth);
            }, 100);
        });
    }

    /**
     * 根据当前模式应用相应的类
     * @private
     */
    _applyCurrentMode() {
        // 移除所有模式类
        this._controlsElement.classList.remove(
            'controls-mode-full',
            'controls-mode-icons',
            'controls-mode-compact',
            'controls-mode-compact-icons',
            'controls-mode-mini'
        );
        
        // 添加当前模式的类
        this._controlsElement.classList.add(`controls-mode-${this._currentMode}`);
    }

    /**
     * 处理控制栏大小变化
     * @private
     * @param {number} width - 控制栏宽度
     */
    _handleControlsResize(width) {
        // 判断控制栏宽度，应用适当的模式
        const availableWidth = width - 40; // 考虑控制栏内边距
        
        console.log(`控制栏可用宽度: ${availableWidth}px`);
        
        let newMode = 'full';
        
        if (availableWidth < this._buttonsFullWidth) {
            // 第一级：宽度不足以显示所有带文字的按钮时，切换到仅图标模式
            newMode = 'icons';
            console.log(`宽度小于完整模式所需 (${this._buttonsFullWidth}px)，切换到仅图标模式`);
            
            if (availableWidth < this._buttonsIconOnlyWidth) {
                // 第二级：宽度不足以显示所有图标按钮时，切换回紧凑模式（不换行的文字按钮）
                newMode = 'compact';
                console.log(`宽度小于仅图标模式所需 (${this._buttonsIconOnlyWidth}px)，切换到紧凑模式`);
                
                if (availableWidth < this._buttonsCompactWidth) {
                    // 第三级：宽度不足以显示紧凑模式时，切换到紧凑图标模式
                    newMode = 'compact-icons';
                    console.log(`宽度小于紧凑模式所需 (${this._buttonsCompactWidth}px)，切换到紧凑图标模式`);
                    
                    if (availableWidth < this._buttonsIconOnlyWidth * 0.8) {
                        // 第四级：宽度更小时，缩小按钮尺寸
                        newMode = 'mini';
                        console.log(`宽度小于图标模式所需的80% (${this._buttonsIconOnlyWidth * 0.8}px)，切换到迷你模式`);
                    }
                }
            }
        }
        
        // 如果模式发生变化，应用新模式
        if (newMode !== this._currentMode) {
            this._currentMode = newMode;
            this._applyCurrentMode();
            
            // 发布模式变更事件
            gEventBus.publish('controls-responsive-mode-changed', {
                mode: this._currentMode,
                width: width
            });
            
            console.log(`控制栏响应式模式切换: ${this._currentMode} (宽度: ${width}px)`);
        }
    }

    /**
     * 创建防抖函数
     * @private
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} - 防抖后的函数
     */
    _debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
}

// 创建单例
const gControlsResponsive = new ControlsResponsive();
export default gControlsResponsive; 