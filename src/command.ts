export interface IParam {
    name: string;
    alias?: string;
    type: 'boolean' | 'string' | 'int' | 'float' | 'file' | 'enum';
    comment?: string;
    default?: boolean | string | number;
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
type TryParseCallBack=(str:string)=>number;
type TryParseBooleanCallBack=(str:string)=>boolean;
const tyrParseInt = (s: string, errFunc:TryParseCallBack) => {
    if (!/^[+-]{0,1}\d+$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        return NaN;
    }
    return parseInt(s);
}
const tyrParseFloat = (s:string, errFunc:TryParseCallBack) => {
    if (!/^[+-]{0,1}\d+(\.\d+)?$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        return NaN;
    }
    return parseFloat(s);
}
const tyrParseBoolean = (s:string, errFunc:TryParseBooleanCallBack) => {
    if (!/^(true|false|1|0|yes|no)$/ig.test(s)) {
        if (errFunc) return errFunc(s);
        throw new Error(`${s} 无效`);
    }
    return /^(true|1|yes)$/ig.test(s);
}
const checkParam = (opt: IParam, arg: string) => {
    const arr = arg.split(' ').filter(s => s);
    if (arr.length == 1) {
        if (opt.type == 'boolean') {
            return {
                name: opt.name,
                alias: opt.alias,
                value: true
            };
        } else {
            if (opt.default === undefined) {
                throw new Error(`缺少参数：${opt.name}`);
            }
            return null;
        }
    }
    const value = arr.slice(1).join(' ');
    switch (opt.type) {
        case 'string':
        case 'enum':
        case 'file':
            return {
                name: opt.name,
                alias: opt.alias,
                value
            };
        case 'int':
            return {
                name: opt.name,
                alias: opt.alias,
                value: tyrParseInt(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：${opt.type}`) } : () => <number>opt.default||0)
            }
        case 'float':
            return {
                name: opt.name,
                alias: opt.alias,
                value: tyrParseFloat(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：${opt.type}`) } : () => <number>opt.default)
            }
        case 'boolean':
            return {
                name: opt.name,
                alias: opt.alias,
                value: tyrParseBoolean(value, opt.default === undefined ? () => { throw new Error(`${opt.name} 输入不正确，必须是：true, false, yes, no`) } : () => <boolean>opt.default)
            }
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
const trimLeft = (str: string, reg: RegExp, replace: string) => str.replace(reg, replace);
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
            return {
                name: `${getCmdOptionName(item)} <${getType(item)}>`,
                comment: `${item.comment}${getDefault(item)}`
            }
        });
        const maxLength = Math.min(arrayMax(lines, (item) => item.name.length) + 1, 35);
        lines.forEach((item) => {
            console.log(`${item.name}${' '.repeat(maxLength - item.name.length)}`, item.comment)
        })
    }
    public parse() {
        if (process.argv.length < 3) { return this; }
        const args = process.argv.slice(2);
        try {
            this.args = [];
            const options: any[] = [];
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg.startsWith('-')) {
                    const found = this.params.find((opt) => (new RegExp(`^-{1,2}(${(opt.alias ? `${opt.name}|${opt.alias}` : opt.name)})`, 'g')).test(arg));
                    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                        i++;
                        if (found) {
                            options.push(checkParam(found, `${arg} ${args[i]}`));
                        } else {
                            options.push({
                                name: trimLeft(arg, /^-?/ig, ''),
                                value: args[i]
                            });
                        }
                    } else {
                        if (found) {
                            options.push(checkParam(found, arg));
                        } else {
                            options.push({
                                name: trimLeft(arg, /^-?/ig, ''),
                                value: undefined
                            });
                        }
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
            console.log(err);
            if (this.autoShowHelp) {
                this.showHelp()
            }
            process.exit(1);
        }
        if (this.options.help === true) {
            this.showHelp();
            process.exit();
        }
        return this;
    }
}
