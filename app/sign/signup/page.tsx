"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<"남성" | "여성" | null>(null);
  const [bio, setBio] = useState("");
  const [district, setDistrict] = useState("");
  const [mbti, setMbti] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [animate, setAnimate] = useState(false);

  const emailDomains = ["gmail.com", "naver.com", "daum.net", "직접 입력"];
  const seoulDistricts = [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
  ];
  const mbtiList = [
    "ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP",
    "ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"
  ];
  const securityQuestions = [
    "좋아하는 색깔은?",
    "가장 기억에 남는 장소는?",
    "가장 친한 친구의 이름은?"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pw: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,15}$/.test(pw);

  useEffect(() => {
    const domain = emailDomain === "직접 입력" ? customDomain : emailDomain;
    const fullEmail = `${emailId}@${domain}`;
    const valid =
      name.trim() &&
      validateEmail(fullEmail) &&
      validatePassword(password) &&
      password === confirmPassword &&
      bio.trim() &&
      district.trim() &&
      mbti.trim() &&
      securityQuestion.trim() &&
      securityAnswer.trim();
    setIsFormValid(Boolean(valid));
  }, [name, emailId, emailDomain, customDomain, password, confirmPassword, bio, district, mbti, securityQuestion, securityAnswer]);

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    const domain = emailDomain === "직접 입력" ? customDomain : emailDomain;
    const fullEmail = `${emailId}@${domain}`;
    if (!name.trim()) newErrors.name = "이름을 입력해주세요.";
    if (!emailId || !domain || !validateEmail(fullEmail)) newErrors.email = "올바른 이메일을 입력해주세요.";
    if (!validatePassword(password)) newErrors.password = "비밀번호는 8~15자, 영문+숫자를 포함해야 합니다.";
    if (password !== confirmPassword) newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    if (!bio.trim()) newErrors.bio = "자기소개를 입력해주세요.";
    if (!district) newErrors.district = "사는 구를 선택해주세요.";
    if (!mbti) newErrors.mbti = "MBTI를 선택해주세요.";
    if (!securityQuestion) newErrors.securityQuestion = "보안 질문을 선택해주세요.";
    if (!securityAnswer.trim()) newErrors.securityAnswer = "보안 질문 답변을 입력해주세요.";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, fullEmail, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          name,
          email: fullEmail,
          gender,
          bio,
          district,
          mbti,
          profileImage: "",
          securityQuestion,
          securityAnswer,
          createdAt: new Date(),
        });
        alert("회원가입 성공!");
        router.push("/sign/signin");
      } catch (error: any) {
        alert("회원가입 실패: " + error.message);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8F1",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        display: "flex",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 오렌지빛 장식 배경 */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(255,155,66,0.35), transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          right: "-120px",
          width: "340px",
          height: "340px",
          background: "radial-gradient(circle, rgba(255,200,150,0.25), transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "500px",
          background: "#FFFDF9",
          borderRadius: "20px",
          boxShadow: "0 6px 18px rgba(255,155,66,0.25)",
          padding: "2rem 1.5rem",
          transform: animate ? "translateY(0)" : "translateY(30px)",
          opacity: animate ? 1 : 0,
          transition: "all 0.8s ease-out",
        }}
      >
        {/* 헤더 */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 900,
            color: "#FF7B00",
            marginBottom: "1.8rem",
            textShadow: "0 3px 10px rgba(255,155,66,0.25)",
          }}
        >
          🍚 밥친구 회원가입
        </h1>

        {/* 이름 */}
        <InputBox label="이름" value={name} onChange={setName} error={errors.name} />

        {/* 이메일 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
          <input
            placeholder="이메일 아이디"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            style={inputStyle}
          />
          <span style={{ alignSelf: "center" }}>@</span>
          <select
            value={emailDomain}
            onChange={(e) => setEmailDomain(e.target.value)}
            style={selectStyle}
          >
            <option value="">도메인 선택</option>
            {emailDomains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {emailDomain === "직접 입력" && (
          <input
            placeholder="도메인 직접 입력"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            style={{ ...inputStyle, marginBottom: "1rem" }}
          />
        )}
        {errors.email && <ErrorMsg text={errors.email} />}

        {/* 비밀번호 */}
        <InputBox
          label="비밀번호 (8~15자, 영문+숫자)"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <InputBox
          label="비밀번호 확인"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />

        {/* 성별 / 지역 / MBTI */}
        <SelectBox label="성별" value={gender || ""} setValue={setGender} options={["남성","여성"]} />
        <SelectBox label="사는 구" value={district} setValue={setDistrict} options={seoulDistricts} />
        <SelectBox label="MBTI" value={mbti} setValue={setMbti} options={mbtiList} />

        {/* 자기소개 */}
        <textarea
          placeholder="자기소개를 입력하세요"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{
            ...inputStyle,
            height: "80px",
            resize: "none",
            border: errors.bio ? "2px solid #FF7B00" : "1px solid #FFD7B5",
          }}
        />
        {errors.bio && <ErrorMsg text={errors.bio} />}

        {/* 보안질문 */}
        <SelectBox
          label="보안 질문"
          value={securityQuestion}
          setValue={setSecurityQuestion}
          options={securityQuestions}
        />
        <InputBox
          label="보안 질문 답변"
          value={securityAnswer}
          onChange={setSecurityAnswer}
          error={errors.securityAnswer}
        />

        {/* 회원가입 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          style={{
            width: "100%",
            marginTop: "1.4rem",
            background: isFormValid
              ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
              : "#E5E7EB",
            color: "#fff",
            fontWeight: 800,
            padding: "1rem",
            border: "none",
            borderRadius: "999px",
            cursor: isFormValid ? "pointer" : "not-allowed",
            boxShadow: isFormValid ? "0 6px 16px rgba(255,123,0,0.35)" : "none",
            transition: "all 0.25s ease",
            fontSize: "1rem",
          }}
        >
          회원가입 완료
        </button>

        {/* 로그인 링크 */}
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          이미 계정이 있나요?{" "}
          <span
            style={{ color: "#FF7B00", fontWeight: 700, cursor: "pointer" }}
            onClick={() => router.push("/sign/signin")}
          >
            로그인
          </span>
        </p>
      </div>
    </div>
  );
}

function InputBox({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          border: error ? "2px solid #FF7B00" : "1px solid #FFD7B5",
        }}
      />
      {error && <ErrorMsg text={error} />}
    </div>
  );
}

function SelectBox({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: any) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{
        ...selectStyle,
        border: "1px solid #FFD7B5",
        marginBottom: "1rem",
      }}
    >
      <option value="">{label} 선택</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return <p style={{ color: "#FF7B00", fontSize: "12px", marginTop: "4px" }}>{text}</p>;
}

const inputStyle = {
  width: "100%",
  border: "1px solid #FFD7B5",
  borderRadius: "10px",
  padding: "12px 14px",
  background: "#FFF8F1",
  fontSize: "0.95rem",
  color: "#3B2B1B",
  outline: "none",
  boxShadow: "0 2px 6px rgba(255,155,66,0.15)",
};

const selectStyle = {
  width: "100%",
  border: "1px solid #FFD7B5",
  borderRadius: "10px",
  padding: "12px 14px",
  background: "#FFF8F1",
  fontSize: "0.95rem",
  color: "#3B2B1B",
};
