# command
node command line parser

| 类型 | 说明 | 值 |
 :- | :- | :- 
| boolean | 布尔（开关） | `yes`、`true`、`no`、`false` |
| string | 字符串 | |
| int | 整形 | 123 |
| float | 浮点 | 1.23 |
| array | 数组 | |
| enum | 枚举 | |

### API

``` ts
/**
 * 枚举类型参数的有效值
 */
declare type IEnumParmType = string | number | boolean;
export interface IParam {
    /**
     * 参数名
     */
    name: string;
    /**
     * 别名（可选）
     */
    alias?: string;
    /**
     * 参数类型
     */
    type: 'boolean' | 'string' | 'int' | 'float' | 'file' | 'enum' | 'array';
    /**
     * 参数说（可选）
     */
    comment?: string;
    /**
     * 默认值，指定了默认值的都是可选
     */
    default?: boolean | string | number;
    /**
     * 枚举类型参数的有效值
     */
    list?: IEnumParmType[];
}
export default class Commands {
    private params;
    private args;
    private options;
    private autoShowHelp;
    /**
     * 初始化
     * @param autoShowHelp 解析发生错误时是否自动显示帮助
     */
    constructor(autoShowHelp?: boolean);
    /**
     * 解析好的参数
     */
    readonly Options: {
        [key: string]: any;
    };
    /**
     * 其他任何无法识别的 输入参数
     */
    readonly Args: string[];
    /**
     * 添加参数
     * @param opt
     */
    addParam(opt: IParam): Commands;
    /**
     * 显示帮助
     */
    showHelp(): void;
    /**
     * 解析命令行参数
     */
    parse(): Commands;
}
```