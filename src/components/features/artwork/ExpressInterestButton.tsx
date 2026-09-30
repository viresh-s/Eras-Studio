'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChatSession } from '@/actions/chatActions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { MessageCircle } from 'lucide-react';

interface ExpressInterestButtonProps {
  artworkId: string;
  creatorId: string;
  userId: string;
}

const predefinedQuestions = [
  'Is this still available?',
  'Do you ship to my location?',
  'Can I see more images?',
  'What are the dimensions of this piece?',
  'Is the price negotiable?',
];

export default function ExpressInterestButton({ artworkId, creatorId, userId }: ExpressInterestButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExpressInterest = async () => {
    const message = selectedQuestion || customMessage;
    if (!message.trim()) return;

    setIsLoading(true);

    try {
      const chatId = await createChatSession(artworkId, userId, creatorId, message);

      setIsModalOpen(false);
      router.push(`/messages/${chatId}`);
    } catch (err) {
      console.error('Failed to express interest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        size="lg"
        variant="coral"
        fullWidth
      >
        <MessageCircle size={18} />
        Express Interest
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Express Your Interest"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Choose a question or write your own message to the creator:</p>

          {/* Predefined Questions */}
          <div className="space-y-2">
            {predefinedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => {
                  setSelectedQuestion(question === selectedQuestion ? null : question);
                  setCustomMessage('');
                }}
                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  selectedQuestion === question
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Or write your own
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setSelectedQuestion(null);
              }}
              placeholder="Hi, I'm interested in this piece..."
              rows={3}
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none resize-y transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            />
          </div>

          <Button
            onClick={handleExpressInterest}
            fullWidth
            isLoading={isLoading}
            disabled={!selectedQuestion && !customMessage.trim()}
          >
            <MessageCircle size={16} />
            Start Conversation
          </Button>
        </div>
      </Modal>
    </>
  );
}
