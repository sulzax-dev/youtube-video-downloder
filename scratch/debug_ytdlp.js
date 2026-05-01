const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();

console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ytdlp)));

async function test() {
    try {
        console.log('Testing info...');
        const info = await ytdlp.getVideoInfo('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
        console.log('Success:', info.title);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
