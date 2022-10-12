const express = require('express');
const wsServer = require('http').createServer();
const app = express();
const { Server } = require('socket.io');
const io = new Server(wsServer, {
    cors: {
        origin: 'https://compare.tmg.sh',
        methods: ['GET', 'POST']
    }
});
const cors = require('cors');

app.use(cors({
    origin: 'https://compare.tmg.sh'
}));

const sessions = [];
const generateId = (length) => {
    const characters = '0123456789';
    let result = '';
    for(var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if(sessions.find(s => s.id === result || s.users.map(u => u.id).includes(result))) return generateId(length);
    return result;
}

io.on('connection', (client) => {
    client.on('disconnect', () => {
        const session = sessions.find(s => s.users.map(u => u.id).includes(client.id));
        if(session) {
            const userIndex = session.users.findIndex(u => u.id === client.id);
            session.users.splice(userIndex);
            io.to(session.id).emit('goaway');
        }
    });
    client.on('join', (data) => {
        const session = sessions.find(s => s.id === data.sessionId);
        if(!session) return client.emit('error', { success: false, msg: 'unknown_session' });
        if(sessions.find(s => s.users.map(u => u.id).includes(client.id))) return client.emit('error', { success: false, msg: 'already_in_session' });
        if(session.status !== 'waiting') return client.emit('error', { success: false, msg: 'not_waiting' });
        session.users.push({
            id: client.id,
            submission: null
        });
        client.join(session.id);
        client.emit('joined', { success: true, id: session.id });
        if(session.users.length === 2) {
            session.status = 'inprogress';
            io.to(session.id).emit('ready');
        }
    });
    client.on('submit', (data) => {
        if(!data.sessionId || !data.msg) return client.emit('error', { success: false, msg: 'missing_data' });
        const session = sessions.find(s => s.id === data.sessionId);
        if(!session.users.map(u => u.id).includes(client.id)) return client.emit('error', { success: false, msg: 'unauthorized' });
        if(session.status !== 'inprogress') return client.emit('error', { success: false, msg: 'session_unready' });
        const userIndex = session.users.findIndex(u => u.id === client.id);
        session.users[userIndex].submission = data.msg;
        let done = true;
        session.users.forEach((u) => {
            if(!u.submission) done = false;
        });
        if(done) {
            const result = session.users[0].submission.toLowerCase() === session.users[1].submission.toLowerCase();
            io.to(session.id).emit('done', { success: true, result });
            io.in(session.id).socketsLeave();
            // sessions.splice(sessions.findIndex(s => s.id === data.sessionId));
        }
    })
});

app.get('/sessions/create', (req, res) => {
    const session = {
        id: generateId(6),
        status: 'waiting',
        users: []
    }
    sessions.push(session);
    return res.json({ status: 'complete', session });
});

app.get('/sessions', (req, res) => {
    return res.json(sessions);
})

wsServer.listen(3002);
app.listen(3001, () => {
    console.log('Listening on port 3001!');
});