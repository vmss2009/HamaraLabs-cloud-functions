const { getFirestore } = require('firebase-admin/firestore');
const app = require("./admin.js");

const db = getFirestore(app);

async function addDoc(collection, data) {
    return await db.collection(collection).add(data);
}

async function addDocWithId(collection, id, data) {
    return await db.collection(collection).doc(id).set(data);
}

async function getDoc(collection, id) {
    return await db.collection(collection).doc(id).get();
}

async function getDocs(collection) {
    return await db.collection(collection).get();
}

async function updateDoc(collection, id, data) {
    return await db.collection(collection).doc(id).update(data);
}

async function deleteDoc(collection, id) {
    return await db.collection(collection).doc(id).delete();
}

module.exports.addDoc = addDoc;
module.exports.addDocWithId = addDocWithId;
module.exports.getDoc = getDoc;
module.exports.getDocs = getDocs;
module.exports.updateDoc = updateDoc;
module.exports.deleteDoc = deleteDoc;
module.exports.db = db;