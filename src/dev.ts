import Commands from './command';

const command = new Commands()
    .addParam({
        type:'boolean',
        name:'b'
    })
    .addParam({
        type:'boolean',
        name:'b2',
        default:false
    })
    .addParam({
        type:'enum',
        name:'type',
        list:['dog', 'cat']
    })
    // .addParam({
    //     type:'enum',
    //     name:'type2',
    // })
    .addParam({
        type:'string',
        name:'str',
    })
    .addParam({
        type:'array',
        name:'files',
    })
    .parse();

console.log(command.Args);
console.log(command.Options);
