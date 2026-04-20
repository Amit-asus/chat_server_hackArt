import { useSocket } from '../hooks/useSocket';
import MainLayout from '../components/layout/MainLayout';

export default function ChatPage() {
  useSocket(); // Initialize socket connection
  return <MainLayout />;
}
