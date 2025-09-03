import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from '@/components/TodoList';
import type { TodoWithAuditLogs } from '@/server/db/schema';
import { trpc } from '@/lib/trpc/client';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: () => ({
      todo: { getAll: { invalidate: vi.fn() } },
    }),
    todo: {
      getAll: {
        useQuery: vi.fn(),
      },
      delete: {
        useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
      },
      toggle: {
        useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
      },
    },
  },
}));

const mockTodos: TodoWithAuditLogs[] = [
  {
    id: 1,
    title: 'Test Todo 1',
    due_date: '2024-12-31',
    done_flag: false,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 2,
    title: 'Test Todo 2',
    due_date: null,
    done_flag: true,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 3,
    title: 'Test Todo 3',
    due_date: null,
    done_flag: false,
    created_at: new Date('2024-01-03'),
    updated_at: new Date('2024-01-03'),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 4,
    title: 'Test Todo 4',
    due_date: null,
    done_flag: false,
    created_at: new Date('2024-01-04'),
    updated_at: new Date('2024-01-04'),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 5,
    title: 'Test Todo 5',
    due_date: null,
    done_flag: false,
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 6,
    title: 'Test Todo 6',
    due_date: null,
    done_flag: false,
    created_at: new Date('2024-01-06'),
    updated_at: new Date('2024-01-06'),
    deleted_at: null,
    auditLogs: [],
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
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('displays empty state when no todos exist', () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('TODO がありません。新しい TODO を追加してください。')).toBeInTheDocument();
  });

  it('displays todos when data is available', () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: mockTodos,
      isLoading: false,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByTestId('todo-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-row-2')).toBeInTheDocument();
  });

  it('sorts todos by title when header is clicked', () => {
    const sortTodos: TodoWithAuditLogs[] = [
      { ...mockTodos[0], id: 1, title: 'B' },
      { ...mockTodos[0], id: 2, title: 'A' },
    ];
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: sortTodos,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    const header = screen.getByText('タイトル');
    fireEvent.click(header);

    const rows = container.querySelectorAll('[data-testid^="todo-row-"]');
    expect(rows[0]).toHaveAttribute('data-testid', 'todo-row-2');
    expect(rows[1]).toHaveAttribute('data-testid', 'todo-row-1');
  });

  it('paginates todos', () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: mockTodos,
      isLoading: false,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.queryByTestId('todo-row-6')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('次'));
    expect(screen.getByTestId('todo-row-6')).toBeInTheDocument();
  });

  it('filters todos by status with checkboxes', async () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: mockTodos,
      isLoading: false,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>,
    );

    const icon = screen.getByTestId('filter-icon-done_flag');
    fireEvent.click(icon);
    const statusFilter = screen.getByTestId('filter-panel-done_flag');
    const all = within(statusFilter).getByLabelText('全て');

    // uncheck root to hide all
    fireEvent.click(all);
    expect(screen.queryByTestId('todo-row-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('todo-row-2')).not.toBeInTheDocument();

    // check root to show all again
    fireEvent.click(all);
    const rowsAfterAll = screen.getAllByTestId(/^todo-row-/);
    expect(rowsAfterAll.length).toBeGreaterThan(0);

    // uncheck 未完了 to show only completed todos
    const incomplete = within(statusFilter).getByLabelText('未完了');
    fireEvent.click(incomplete);
    expect(screen.queryByTestId('todo-row-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('todo-row-2')).toBeInTheDocument();
  });

  it('handles null or undefined data gracefully', () => {
    vi.mocked(trpc.todo.getAll.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    render(
      <Wrapper>
        <TodoList />
      </Wrapper>
    );

    expect(screen.getByText('TODO がありません。新しい TODO を追加してください。')).toBeInTheDocument();
  });
});