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
        variant="pink"
        fullWidth
      >
        <MessageCircle size={20} />
        Express Interest
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Express Your Interest"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-brand-gray">Choose a question or write your own message to the creator:</p>

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
                className={`w-full text-left p-3 border-2 border-brand-black transition-all text-sm font-medium ${
                  selectedQuestion === question
                    ? 'bg-brand-yellow shadow-brutal-sm'
                    : 'bg-white hover:bg-brand-lightgray'
                }`}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Custom Message */}
          <div>
            <label className="font-heading font-semibold text-sm uppercase tracking-wide block mb-1.5">
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
              className="input-brutal resize-y"
            />
          </div>

          <Button
            onClick={handleExpressInterest}
            fullWidth
            isLoading={isLoading}
            disabled={!selectedQuestion && !customMessage.trim()}
            variant="pink"
          >
            <MessageCircle size={18} />
            Start Conversation
          </Button>
        </div>
      </Modal>
    </>
  );
}
