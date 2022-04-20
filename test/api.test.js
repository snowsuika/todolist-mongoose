const chai = require('chai');
const { assert } = require('chai');
const { expect } = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
chai.should();
chai.use(chaiHttp);

describe('Post CURD API Testing', () => {
    /**
     * 測試 GET route
     */
    describe('GET /posts', () => {
        it('取得所有 posts 列表，並且回傳 array', (done) => {
            chai.request(server)
                .get('/posts')
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.statusCode).to.equal(200);
                    expect(response.body.data).to.be.an('array');
                    done();
                });
        });

        it('輸入錯誤的路由，應回傳 Status 404 及「找不到此路由」訊息', (done) => {
            chai.request(server)
                .get('/post')
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.statusCode).to.equal(404);
                    expect(response.body.message).to.equal('找不到此路由');
                    done();
                });
        });
    });

    /**
     * 測試 GET route，包含 Query String
     */
    describe('GET /posts/keyword=這是測試內容', () => {
        it('取得所有貼文內容包含「這是測試內容」字串的貼文，status = 200，content 皆須包含該字串', (done) => {
            chai.request(server)
                .get('/posts')
                .query({
                    keyword: '這是測試內容',
                    sort: 'asc',
                })
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(200);
                    expect(response.body.data).to.be.a('array');
                    response.body.data.forEach((item) => {
                        expect(item.content).to.match(/這是測試內容/);
                    });

                    done();
                });
        });
    });

    /**
     * 測試 GET (by id) 取得單筆 post
     */
    describe('GET /post/:id', () => {
        let id = '';
        //先塞一筆，並取得貼文 id
        before((done) => {
            const newPost = {
                name: 'Snow',
                content: '這是測試內容',
                image: 'image.jpg',
            };
            chai.request(server)
                .post('/posts')
                .send(newPost)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.statusCode).to.equal(200);
                    id = response.body.data[0]._id;
                    done();
                });
        });

        it('取得單筆 post，回傳 Status = 200，物件包含屬性：_id、name、content、image、likes、createdAt', (done) => {
            chai.request(server)
                .get('/posts/' + id)
                .end((err, response) => {
                    assert.notExists(err);
                    const resData = response.body.data[0];

                    expect(err).to.not.exist;
                    expect(response.statusCode).to.equal(200);
                    expect(resData).to.be.an('object');

                    assert.hasAllKeys(resData, ['_id', 'name', 'content', 'image', 'likes', 'createdAt']);
                    done();
                });
        });

        it('取得單筆貼文，id 不存在，預期回應 status = 400，訊息「資料取得失敗」', (done) => {
            const id = 123;
            chai.request(server)
                .get('/posts/' + id)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(400);
                    expect(response.body.status).to.equal('error');
                    expect(response.body.message).to.equal('資料取得失敗');

                    done();
                });
        });
    });

    /**
     * 測試 POST
     */
    describe('POST /posts', () => {
        it('新增一篇貼文，回應 status = 200，回傳所有貼文 array', (done) => {
            const post = {
                name: 'Snow',
                content: '這是測試內容',
                image: 'https://upload.cc/i1/2022/04/17/B56h0r.png',
            };
            chai.request(server)
                .post('/posts')
                .send(post)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(200);

                    expect(response.body.data).to.be.a('array');

                    done();
                });
        });

        it('新增一篇貼文，沒有填寫必填欄位(name)，回應 status = 400、「name 為必填欄位」', (done) => {
            const post = {
                content: '這是測試內容-沒有填寫必填欄位',
                image: 'https://upload.cc/i1/2022/04/17/B56h0r.png',
            };
            chai.request(server)
                .post('/posts')
                .send(post)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(400);
                    expect(response.body.message).to.equal('name 為必填欄位');
                    done();
                });
        });
    });

    /**
     * 測試 PATCH
     */
    describe('PATCH /posts', () => {
        let id = '';
        //先塞一筆，並取得貼文 id
        before((done) => {
            const newPost = {
                name: 'Snow',
                content: '這是測試內容',
                image: 'image.jpg',
            };
            chai.request(server)
                .post('/posts')
                .send(newPost)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.statusCode).to.equal(200);
                    id = response.body.data[0]._id;
                    done();
                });
        });

        it('編輯一篇貼文，回應 status = 200，retrun 更新後內容，需與新增時相同', (done) => {
            const updatePost = {
                name: 'Snow-PATCH-UPDATE',
                content: '這是測試內容-PATCH-UPDATE',
                image: 'image-PATCH-UPDATE.jpg',
            };
            chai.request(server)
                .patch('/posts/' + id)
                .send(updatePost)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(200);

                    expect(response.body.data).to.include.keys(['_id', 'name', 'content', 'image', 'createdAt']);
                    expect(response.body.data.name).to.equal('Snow-PATCH-UPDATE');
                    expect(response.body.data.content).to.equal('這是測試內容-PATCH-UPDATE');
                    expect(response.body.data.image).to.equal('image-PATCH-UPDATE.jpg');

                    done();
                });
        });
    });

    /**
     * 測試 DELETE (全部)
     */
    describe('DELETE /posts/:id', () => {
        it('刪除全部貼文，預期 status = 200、回傳所有貼文 array', (done) => {
            const id = 123;
            chai.request(server)
                .delete('/posts')
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(200);
                    expect(response.body.data).to.be.a('array');

                    done();
                });
        });
    });

    /**
     * 測試 DELETE (單筆)
     */
    describe('DELETE /posts/:id', () => {
        let id = '';
        //刪除之前先篩一筆，並取得貼文 id
        before((done) => {
            const newPost = {
                name: 'Snow-DELETE-TEST',
                content: '這是測試內容-DELETE-TEST',
                image: 'image-DELETE-TEST.jpg',
            };
            chai.request(server)
                .post('/posts')
                .send(newPost)
                .end((err, response) => {
                    expect(err).to.not.exist;

                    expect(response.status).to.equal(200);
                    id = response.body.data[0]._id;
                    done();
                });
        });

        it('刪除單筆貼文，預期 status = 200，回傳所有貼文', (done) => {
            chai.request(server)
                .delete('/posts/' + id)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(200);
                    expect(response.body.data).to.be.a('array');
                    done();
                });
        });

        it('刪除單筆貼文，貼文 id 不存在。預期回應 Status = 400、「刪除失敗，請確認 id 是否正確。」', (done) => {
            const id = 123;
            chai.request(server)
                .delete('/posts/' + id)
                .end((err, response) => {
                    expect(err).to.not.exist;
                    expect(response.status).to.equal(400);
                    expect(response.body.message).to.equal('刪除失敗，請確認 id 是否正確。');

                    done();
                });
        });
    });
});
