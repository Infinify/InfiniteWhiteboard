require('../config').db(async (db) => {
    const names = (await db.collection('_whiteboards').find().toArray()).map(w => w.name);

    let i = 1;
    while (names.indexOf(`Origins${i}`) !== -1) {
        i++;
    }

    const global = '_global';
    const name = `Origins${i}`;
    const chatLog = 'chatlog__global';
    const nextLog = `chatlog_${name}`;
    
    await Promise.all([
        db.collection('_whiteboards').insertOne({name}),
        db.collection(global).rename(name),
        db.collection(chatLog).rename(nextLog)
    ]);
    
    await Promise.all([
        db.createCollection(global),
        db.createCollection(chatLog)
    ]);
});
