interface ChatStarterPromptsProps {
  onPromptClick: (prompt: string) => void;
}

const starterPrompts = [
  {
    title: 'Delegation Help',
    preview: 'I need help delegating tasks to my team effectively'
  },
  {
    title: 'Feedback Practice',
    preview: 'How do I give difficult feedback to a team member?'
  },
  {
    title: 'Meeting Efficiency',
    preview: 'My meetings are unproductive. What can I do?'
  },
  {
    title: 'Team Motivation',
    preview: 'How can I better motivate my team members?'
  }
];

export function ChatStarterPrompts({ onPromptClick }: ChatStarterPromptsProps) {
  return (
    <div className="text-center py-16 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-white border-4 border-[var(--text-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
        <span className="text-2xl font-black">∞</span>
      </div>
      <h2 className="text-2xl font-bold mb-4">Start a Conversation</h2>
      <p className="text-[var(--text-secondary)] text-lg mb-10">
        Ask me anything about management, leadership, or applying Level Up concepts
      </p>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {starterPrompts.map((prompt, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left"
            onClick={() => onPromptClick(prompt.preview)}
          >
            <h3 className="font-semibold mb-2">{prompt.title}</h3>
            <p className="text-[var(--text-secondary)] text-sm">{prompt.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}