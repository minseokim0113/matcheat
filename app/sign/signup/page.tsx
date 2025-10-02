'use client';
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

// ✅ Firebase 불러오기
import { auth, db, storage } from "../../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<"남성" | "여성" | null>(null);

  // ✅ 이미지 파일과 미리보기 상태
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null, null, null]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...images];
      newFiles[index] = file;
      setImages(newFiles);

      const newPreviews = [...previewUrls];
      newPreviews[index] = URL.createObjectURL(file);
      setPreviewUrls(newPreviews);
    }
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const emailDomains = ["gmail.com", "naver.com", "daum.net", "직접 입력"];

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pw: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,15}$/.test(pw);

  // ✅ 전체 유효성 검사
  useEffect(() => {
    const fullEmail = `${emailId}@${emailDomain}`;
    const valid =
      name.trim() &&
      validateEmail(fullEmail) &&
      validatePassword(password) &&
      password === confirmPassword &&
      images[0]; 
    setIsFormValid(Boolean(valid));
  }, [name, emailId, emailDomain, password, confirmPassword, images]);

  // ✅ 회원가입 처리
  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    const fullEmail = `${emailId}@${emailDomain}`;

    if (!name.trim()) newErrors.name = "이름을 입력해주세요.";
    if (!emailId || !emailDomain || !validateEmail(fullEmail)) {
      newErrors.email = "올바른 이메일을 입력해주세요.";
    }
    if (!validatePassword(password)) {
      newErrors.password = "비밀번호는 8~15자, 영문+숫자를 포함해야 합니다.";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
    if (!images[0]) {
      newErrors.image = "프로필 이미지는 최소 1장은 필요합니다.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          fullEmail,
          password
        );
        const user = userCredential.user;

        let profileImageUrl = "";
        if (images[0]) {
          const imageRef = ref(storage, `profileImages/${user.uid}`);
          await uploadBytes(imageRef, images[0]);
          profileImageUrl = await getDownloadURL(imageRef);
        }

        await setDoc(doc(db, "users", user.uid), {
          name,
          email: fullEmail,
          gender,
          profileImage: profileImageUrl,
          createdAt: new Date(),
        });

        alert("회원가입 성공!");
        router.push("/signin");
      } catch (error: any) {
        alert("회원가입 실패: " + error.message);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "sans-serif", padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>회원가입</h1>

      {/* ✅ 프로필 이미지 업로드 (맨 위로 이동) */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>프로필 이미지</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {previewUrls.map((img, idx) => (
            <label key={idx} style={{
              border: "2px solid #ccc",
              borderRadius: "8px",
              height: "100px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              overflow: "hidden",
            }}>
              {img ? (
                <img src={img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "24px", color: "#999" }}>+</span>
              )}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, idx)} />
            </label>
          ))}
        </div>
        {errors.image && <p style={{ color: "red", fontSize: "12px" }}>{errors.image}</p>}
      </div>

      {/* 이름 */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="이름 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            border: errors.name ? "2px solid red" : "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        />
        {errors.name && <p style={{ color: "red", fontSize: "12px" }}>{errors.name}</p>}
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="이메일 아이디"
          value={emailId}
          onChange={(e) => setEmailId(e.target.value)}
          style={{
            flex: 1,
            border: errors.email ? "2px solid red" : "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        />
        <span>@</span>
        <select
          value={emailDomain}
          onChange={(e) => setEmailDomain(e.target.value)}
          style={{
            flex: 1,
            border: errors.email ? "2px solid red" : "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        >
          <option value="">도메인 선택</option>
          {emailDomains.map((domain) => (
            <option key={domain} value={domain === "직접 입력" ? "" : domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>
      {errors.email && <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p>}

      {/* 비밀번호 */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="password"
          placeholder="비밀번호 (8~15자 영문+숫자)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            border: errors.password ? "2px solid red" : "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        />
        {errors.password && <p style={{ color: "red", fontSize: "12px" }}>{errors.password}</p>}
      </div>

      {/* 비밀번호 확인 */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: "100%",
            border: errors.confirmPassword ? "2px solid red" : "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        />
        {errors.confirmPassword && <p style={{ color: "red", fontSize: "12px" }}>{errors.confirmPassword}</p>}
      </div>

      {/* 성별 선택 */}
      <div style={{ marginBottom: "16px" }}>
        <select
          value={gender || ""}
          onChange={(e) => setGender(e.target.value as "남성" | "여성")}
          style={{
            width: "100%",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
          }}
        >
          <option value="">성별 선택</option>
          <option value="남성">남성</option>
          <option value="여성">여성</option>
        </select>
      </div>

      {/* 회원가입 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid}
        style={{
          width: "100%",
          backgroundColor: isFormValid ? "#3b82f6" : "#d1d5db",
          color: "white",
          fontWeight: "600",
          padding: "12px",
          borderRadius: "9999px",
          border: "none",
          cursor: isFormValid ? "pointer" : "not-allowed",
        }}
      >
        회원가입
      </button>

      <p style={{ fontSize: "14px", textAlign: "center", marginTop: "12px" }}>
        이미 계정이 있나요?{" "}
        <span
          style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "bold" }}
          onClick={() => router.push("/signin")}
        >
          로그인
        </span>
      </p>
    </div>
  );
}

