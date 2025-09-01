import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from '@/components/TodoList';
import type { Todo } from '@/server/db/schema';

// Mock TodoItem component
vi.mock('@/components/TodoItem', () => {
  const MockTodoItem = ({ todo }: { todo: Todo }) => (
    <div data-testid={`todo-item-${todo.id}`}>
      {todo.title}
    </div>
  );
  MockTodoItem.displayName = 'MockTodoItem';
  return { TodoItem: MockTodoItem };
});

const mockTodos: Todo[] = [
  {
    id: 1,
    title: 'Test Todo 1',
    due_date: '2024-12-31',
    done_flag: false,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    title: 'Test Todo 2',
    due_date: null,
    done_flag: true,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
  },
];

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

describe('TodoList', () => {
  const Wrapper = createWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: undefined,
              isLoading: true,
              error: null,
            }),
          },
        },
      },
    }));

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: undefined,
              isLoading: false,
              error: new Error('Failed to fetch'),
            }),
          },
        },
      },
    }));

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('displays empty state when no todos exist', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: [],
              isLoading: false,
              error: null,
            }),
          },
        },
      },
    }));

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('TODO がありません。新しい TODO を追加してください。')).toBeInTheDocument();
  });

  it('displays todos when data is available', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: mockTodos,
              isLoading: false,
              error: null,
            }),
          },
        },
      },
    }));

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
  });

  it('renders todos in correct order', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: mockTodos,
              isLoading: false,
              error: null,
            }),
          },
        },
      },
    }));

    const { container } = render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    const todoItems = container.querySelectorAll('[data-testid^="todo-item-"]');
    expect(todoItems).toHaveLength(2);
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-1');
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-2');
  });

  it('handles null or undefined data gracefully', () => {
    vi.doMock('@/lib/trpc/client', () => ({
      trpc: {
        todo: {
          getAll: {
            useQuery: () => ({
              data: null,
              isLoading: false,
              error: null,
            }),
          },
        },
      },
    }));

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('TODO がありません。新しい TODO を追加してください。')).toBeInTheDocument();
  });
});