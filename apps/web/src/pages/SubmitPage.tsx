import SubmitForm from "../components/SubmitForm";

interface SubmitPageProps {
  userId: string;
  onSubmitted: () => void;
}

export default function SubmitPage({ userId, onSubmitted }: SubmitPageProps) {
  return <SubmitForm userId={userId} onSubmitted={onSubmitted} />;
}
