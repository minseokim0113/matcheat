import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// ✅ 환경변수 기반 초기화 (firebase-admin.json 파일 X)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY as string);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendTempPassword = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { uid, tempPassword } = req.body;
    if (!uid || !tempPassword) {
      res.status(400).send("Bad Request");
      return;
    }

    // 🔹 Auth 비밀번호 변경
    await admin.auth().updateUser(uid, { password: tempPassword });

    // 🔹 Firestore에도 기록 (선택)
    await admin.firestore().collection("users").doc(uid).update({ tempPassword });

    res.status(200).send({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
