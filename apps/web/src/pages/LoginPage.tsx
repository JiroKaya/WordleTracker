import Login from "../components/Login";

interface LoginPageProps {
  onLogin: (id: string, username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return <Login onLogin={onLogin} />;
}
