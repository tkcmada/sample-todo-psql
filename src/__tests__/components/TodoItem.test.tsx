import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoItem } from '@/components/TodoItem';
import type { Todo } from '@/server/db/schema';

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
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockTodo: Todo = {
  id: 1,
  title: 'Test Todo',
  due_date: '2024-12-31',
  done_flag: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockCompletedTodo: Todo = {
  ...mockTodo,
  id: 2,
  title: 'Completed Todo',
  done_flag: true,
};

describe('TodoItem', () => {
  const Wrapper = createWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
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

    const deleteButton = screen.getByRole('button', { name: '' }); // Trash icon button
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    const editButton = screen.getAllByRole('button')[1]; // Edit button (second button)
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
    });
  });

  it('updates todo in edit mode', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    // Enter edit mode
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Test Todo');
      const dueDateInput = screen.getByDisplayValue('2024-12-31');
      
      // Update values
      fireEvent.change(titleInput, { target: { value: 'Updated Todo' } });
      fireEvent.change(dueDateInput, { target: { value: '2025-01-01' } });

      // Save changes
      const saveButton = screen.getByRole('button', { name: '' }); // Check icon
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 1,
        title: 'Updated Todo',
        due_date: '2025-01-01',
      });
    });
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    // Enter edit mode
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Test Todo');
      fireEvent.change(titleInput, { target: { value: 'Should be cancelled' } });

      // Cancel changes
      const cancelButton = screen.getAllByRole('button')[1]; // X icon
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Should be cancelled')).not.toBeInTheDocument();
      expect(mockUpdateMutate).not.toHaveBeenCalled();
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

  it('does not submit update with empty title', async () => {
    render(
      <Wrapper>
        <TodoItem todo={mockTodo} />
      </Wrapper>
    );

    // Enter edit mode
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Test Todo');
      
      // Clear title
      fireEvent.change(titleInput, { target: { value: '' } });

      // Try to save
      const saveButton = screen.getByRole('button', { name: '' });
      fireEvent.click(saveButton);
    });

    // Should not call update
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });
});