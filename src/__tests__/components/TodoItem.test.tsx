import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoItem } from '@/components/TodoItem';
import type { TodoWithAuditLogs } from '@/server/db/schema';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock tRPC client
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockToggleMutate = vi.fn();
const mockInvalidate = vi.fn();

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: () => ({
      todo: {
        getAll: {
          invalidate: mockInvalidate,
        },
      },
    }),
    todo: {
      update: {
        useMutation: () => ({
          mutate: mockUpdateMutate,
          isLoading: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: mockDeleteMutate,
          isLoading: false,
        }),
      },
      toggle: {
        useMutation: () => ({
          mutate: mockToggleMutate,
          isLoading: false,
        }),
      },
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientProviderWrapper';
  return Wrapper;
};

const mockTodo: TodoWithAuditLogs = {
  id: 1,
  title: 'Test Todo',
  due_date: '2024-12-31',
  done_flag: false,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  auditLogs: [],
};

const mockCompletedTodo: TodoWithAuditLogs = {
  ...mockTodo,
  id: 2,
  title: 'Completed Todo',
  done_flag: true,
};

describe('TodoItem', () => {
  const Wrapper = createWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders todo item correctly', () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText('期限: 2024-12-31')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '未完了' })).toBeInTheDocument();
  });

  it('renders completed todo with different styling', () => {
    render(
      <Wrapper>
        <TodoItem todo={mockCompletedTodo} />
      </Wrapper>
    );

    expect(screen.getByText('Completed Todo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完了' })).toBeInTheDocument();
  });

  it('renders todo without due date', () => {
    const todoWithoutDate = { ...mockTodo, due_date: null };
    
    render(
      <Wrapper>
        <TodoItem todo={todoWithoutDate} />
      </Wrapper>
    );

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.queryByText(/期限:/)).not.toBeInTheDocument();
  });

  it('toggles todo completion status', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    const toggleButton = screen.getByRole('button', { name: '未完了' });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockToggleMutate).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('deletes todo', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    const deleteButton = screen.getAllByRole('button', { name: '' })[1]; // Delete icon button
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('navigates to edit page when edit button is clicked', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    const editButton = screen.getAllByRole('button', { name: '' })[0]; // Edit icon button
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/edit/1');
    });
  });


  it('applies opacity to completed todos', () => {
    const { container } = render(
      <Wrapper>
        <TodoItem todo={mockCompletedTodo} />
      </Wrapper>
    );

    const cardElement = container.querySelector('.opacity-70');
    expect(cardElement).toBeInTheDocument();
  });

  it('shows audit logs when history button is clicked', async () => {
    const todoWithAuditLogs = {
      ...mockTodo,
      auditLogs: [
        {
          id: 1,
          todo_id: 1,
          action: 'CREATE',
          old_values: null,
          new_values: JSON.stringify({ title: 'Test Todo' }),
          created_at: new Date(),
        },
      ],
    };

    render(
      <Wrapper>
        <TodoItem todo={todoWithAuditLogs} />
      </Wrapper>
    );

    const historyButton = screen.getByText('履歴 (1)');
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText('TODOを作成しました')).toBeInTheDocument();
    });
  });
});