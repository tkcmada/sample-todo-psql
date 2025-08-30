import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoForm } from '@/components/TodoForm';

// Mock tRPC client
const mockMutate = vi.fn();
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
      create: {
        useMutation: () => ({
          mutate: mockMutate,
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

describe('TodoForm', () => {
  const Wrapper = createWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText('TODO のタイトルを入力...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // date input
    expect(screen.getByRole('button', { name: 'TODO を追加' })).toBeInTheDocument();
  });

  it('updates title input value', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });

    await waitFor(() => {
      expect(titleInput).toHaveValue('Test Todo');
    });
  });

  it('updates due date input value', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const dateInput = screen.getByDisplayValue(''); // date input
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

    await waitFor(() => {
      expect(dateInput).toHaveValue('2024-12-31');
    });
  });

  it('submits form with valid data', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    const dateInput = screen.getByDisplayValue('');
    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });

    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        title: 'Test Todo',
        due_date: '2024-12-31',
      });
    });
  });

  it('submits form with only title', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });

    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        title: 'Test Todo',
        due_date: null,
      });
    });
  });

  it('does not submit form with empty title', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('disables submit button when title is empty', () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when title is provided', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });

    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('prevents submission with form event', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const form = screen.getByRole('button').closest('form');
    const preventDefault = vi.fn();
    
    if (form) {
      fireEvent.submit(form, { preventDefault });
      expect(preventDefault).toHaveBeenCalled();
    }
  });
});