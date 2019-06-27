type IEnumParmType = string | number | boolean;
export interface IParam {
    name: string;
    alias?: string;
    type: 'boolean' | 'string' | 'int' | 'float' | 'file' | 'enum' | 'array';
    comment?: string;
    /**
     * 默认值，指定了默认值的都是可选
     */
    default?: boolean | string | number;
    list?: IEnumParmType[],
}

function arrayMax<T>(array: T[], callBack: (item: T) => number): number
function arrayMax<T>(array: any[], callBack?: (item: T) => number): number {
    return callBack
        ? Math.max.apply(Math, array.map(callBack))
        : Math.max.apply(Math, array);
}
function arrayMin<T>(array: T[], callBack: (item: T) => number): number
function arrayMin<T>(array: any[], callBack?: (item: T) => number): number {
    return callBack
        ? Math.min.apply(Math, array.map(callBack))
        : Math.min.apply(Math, array);
}
type TryParseCallBack = (str: string) => number;
type TryParseBooleanCallBack = (str: string) => boolean;
const tyrParseInt = (s: string, errFunc: TryParseCallBack) => {
    if (!/^[+-]{0,1}\d+$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        return NaN;
    }
    return parseInt(s);
}
const tyrParseFloat = (s: string, errFunc: TryParseCallBack) => {
    if (!/^[+-]{0,1}\d+(\.\d+)?$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        return NaN;
    }
    return parseFloat(s);
}
const tyrParseBoolean = (s: string, errFunc: TryParseBooleanCallBack) => {
    if (!/^(true|false|1|0|yes|no)$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        throw new Error(`${s} 无效`);
    }
    return /^(true|1|yes)$/ig.test(s);
}
const checkParam = (opt: IParam, ...values: string[]) => {
    const result = {
        name: opt.name,
        alias: opt.alias,
        value: undefined,
    }
    if (values.length < 1) {
        if (opt.type == 'boolean') {
            return {
                ...result,
                value: true
            };
        } else if (opt.default === undefined) {
            throw new Error(`缺少参数：${opt.name}`);
        }
    }
    const value = values[0];
    switch (opt.type) {
        case 'string':
        case 'file':
            return {
                ...result,
                value: values.join(' '),
            };
        case 'enum':
            if (opt.list.filter(s => s == value).length > 0) {
                return {
                    ...result,
                    value,
                };
            } else {
                throw new Error(`${opt.name} 缺少参数，${opt.list.join(',')}`);
            }
        case 'int':
            return {
                ...result,
                value: tyrParseInt(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：${opt.type}`) } : () => <number>opt.default || 0)
            }
        case 'float':
            return {
                ...result,
                value: tyrParseFloat(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：${opt.type}`) } : () => <number>opt.default)
            }
        case 'boolean':
            return {
                ...result,
                value: tyrParseBoolean(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：true, false, yes, no`) } : () => <boolean>opt.default)
            }
        case 'array':
            return {
                ...result,
                value: values
            };
        default: return null;
    }
}
const getType = (opt: IParam) => {
    return opt.type
}
const getDefault = (opt: IParam) => {
    if (opt.default || opt.default === false || opt.default === '') {
        if (typeof opt.default === 'string') {
            return ` 默认值："${opt.default}"`;
        }
        return ` 默认值：${opt.default}`;
    }
    return '';
}
const getCmdOptionName = (opt: IParam) => {
    if (opt.alias) {
        return (opt.name.length > 1 ? `--${opt.name}` : `-${opt.name}`) + ', ' +
            (opt.alias.length > 1 ? `--${opt.alias}` : `-${opt.alias}`);
    }
    return opt.name.length > 1 ? `--${opt.name}` : `-${opt.name}`;
};
export default class Commands {
    private params: IParam[] = [];
    private args: string[] = [];
    private options: { [key: string]: any } = {};
    private autoShowHelp = true;
    constructor(autoShowHelp = true) {
        // this.showHelp();
        this.autoShowHelp = autoShowHelp;
        this.addParam({
            name: 'H',
            alias: 'help',
            type: 'boolean',
            default: false,
            comment: '显示帮助'
        });
    }
    public get Options() { return this.options; }
    public get Args() { return this.args; }

    public addParam(opt: IParam): Commands {
        if (opt.type === 'enum' && (opt.list === undefined || opt.list === null || opt.list.length < 1)) {
            throw new Error(`枚举类型必须指定有效值：${opt.name}`);
        }
        this.params.push(opt);
        if (opt.default !== undefined) {
            this.options[opt.name] = opt.default;
            if (opt.alias)
                this.options[opt.alias] = opt.default;
        }
        return this;
    }

    public showHelp() {
        const lines = this.params.map(item => {
            let comments = item.comment || '';
            if (item.list) {
                comments += ' ' + item.list.join(',');
            }
            return {
                name: `${getCmdOptionName(item)} <${getType(item)}>`,
                comment: `${comments}${getDefault(item)}`
            }
        });
        const maxLength = Math.min(arrayMax(lines, (item) => item.name.length) + 1, 35);
        lines.forEach((item) => {
            console.log(`${item.name}${' '.repeat(maxLength - item.name.length)}`, item.comment)
        })
    }
    public parse() {
        const requireList = this.params.filter(p => p.default == undefined);
        if (process.argv.length < 3) {
            if (requireList.length < 1) {
                return this;
            }
            console.error(`没有指定参数`);
            if (this.autoShowHelp) {
                this.showHelp()
            }
            process.exit(1);
        }
        const args = process.argv.slice(2);
        try {
            this.args = [];
            const options: any[] = [];
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg.startsWith('-')) {
                    const found = this.params.find((opt) => (new RegExp(`^-{1,2}(${(opt.alias ? `${opt.name}|${opt.alias}` : opt.name)})$`, 'g')).test(arg));
                    if (found) {
                        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                            let tmpStr: string[] = [];
                            for (let j = i + 1; j < args.length && !args[j].startsWith('-'); j++) {
                                tmpStr.push(args[j]);
                                i = j;
                            }
                            options.push(checkParam(found, ...tmpStr));
                        } else {
                            options.push(checkParam(found));
                        }
                    } else {
                        //     if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                        //         let tmpStr: string[] = [];
                        //         for (let j = i + 1; j < args.length && !args[j].startsWith('-'); j++) {
                        //             tmpStr.push(args[j]);
                        //             i = j;
                        //         }
                        //         options.push({
                        //             name: arg.replace(/^-{1,}/ig, ''),
                        //             value: tmpStr
                        //         });
                        //     } else {
                        //         options.push({
                        //             name: arg.replace(/^-{1,}/ig, ''),
                        //             value: undefined
                        //         });
                        //     }
                        this.args.push(arg);
                    }
                } else {
                    this.args.push(arg);
                }
            }
            options.filter(f => !!f).forEach((option) => {
                if (option.alias) {
                    this.options[option.alias] = option.value;
                }
                this.options[option.name] = option.value;
            });
        } catch (err) {
            console.error(err.message);
            // console.log(err);
            if (this.autoShowHelp) {
                this.showHelp()
            }
            process.exit(1);
        }
        if (this.options.help === true) {
            this.showHelp();
            process.exit();
        }
        this.params.filter(p => p.default == undefined)
            .forEach(p => {
                if (this.options[p.name] != undefined || (p.alias && this.options[p.alias] != undefined)) return;
                console.error(`必须指定参数：${p.name}`);
                if (this.autoShowHelp) {
                    this.showHelp()
                }
                process.exit(1);
            });

        return this;
    }
}
