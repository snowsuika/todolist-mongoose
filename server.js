const http = require('http');
const url = require('url');
const mongoose = require('mongoose');
const { successHandles, errorHandles } = require('./common/responseHandle');
const { Post } = require('./models/post');

//連接資料庫
mongoose
    .connect('mongodb://localhost:27017')
    .then(() => {
        console.log('連線成功');
    })
    .catch((error) => {
        console.log('連線失敗', error);
    });

const requestListener = async (req, res) => {
    const urlObj = url.parse(req.url, true);
    const reqUrl = urlObj.pathname;
    const httpMethod = req.method;

    let body = '';
    req.on('data', (chunk) => (body += chunk));
    body = await new Promise((resolve) => req.on('end', () => resolve(body)));

    /**
     * @return {Promise<string>} all post array
     */
    const getAllPost = () => {
        keyword = urlObj.query.keyword || '';
        sort = urlObj.query.sort || 'asc';

        //asc 遞增 (default) ; desc 遞減 ;
        sort = sort === 'desc' ? -1 : 1;

        return Post.find({ content: { $regex: keyword } }).sort({ createdAt: sort });
    };

    /**
     * @param {Number} id
     * @return {Promise<string>} single post
     */
    const getSinglePost = (id) => Post.find({ _id: id });

    /* GET */
    if (reqUrl == '/posts' && httpMethod == 'GET') {
        try {
            const posts = await getAllPost();
            successHandles(res, posts);
        } catch (error) {
            errorHandles(res, 400, '資料取得失敗');
        }
        /* POST */
    } else if (reqUrl == '/posts' && httpMethod == 'POST') {
        try {
            const data = JSON.parse(body);
            await Post.create({
                name: data.name,
                content: data.content,
                image: data.image,
            });
            const posts = await getAllPost();
            successHandles(res, posts, '新增成功');
        } catch (error) {
            let errorMsg = '';
            if (error.errors) {
                let errorMessage = [];
                Object.keys(error.errors).forEach((field) =>
                    errorMessage.push(`${field} ${error.errors[field].properties.message}`)
                );
                errorMsg = errorMessage.join('、');
            } else {
                errorMsg = '新增失敗，欄位未填寫正確。';
            }
            errorHandles(res, 400, errorMsg);
        }
        /*DELETE - ALL */
    } else if (reqUrl == '/posts' && httpMethod == 'DELETE') {
        try {
            await Post.deleteMany({});
            const posts = await getAllPost();
            successHandles(res, posts);
        } catch (error) {
            errorHandles(res, 400, '刪除失敗');
        }
        /* DELETE - SINGLE */
    } else if (reqUrl.startsWith('/posts/') && httpMethod == 'DELETE') {
        try {
            const id = reqUrl.split('/').pop();
            await Post.findByIdAndDelete(id);
            const posts = await getAllPost();
            successHandles(res, posts);
        } catch (error) {
            errorHandles(res, 400, '刪除失敗，請確認 id 是否正確。');
        }
        /* PATCH*/
    } else if (reqUrl.startsWith('/posts/') && httpMethod == 'PATCH') {
        try {
            const id = reqUrl.split('/').pop();
            const data = JSON.parse(body);

            await Post.findByIdAndUpdate(id, {
                name: data.name,
                content: data.content,
                image: data.image,
            });
            const updatePostData = await getSinglePost(id);
            successHandles(res, updatePostData, '更新成功');
        } catch (error) {
            errorHandles(res, 404, '更新失敗，欄位錯誤或是 id 不存在。');
        }
        /* OPTIONS*/
    } else if (httpMethod == 'OPTIONS') {
        successHandles(res);
    } else {
        errorHandles(res, 404, '找不到此路由');
    }
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);