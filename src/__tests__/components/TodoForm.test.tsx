import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientProviderWrapper';
  return Wrapper;
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
    expect(screen.getByRole('textbox')).toBeInTheDocument(); // title input
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs).toHaveLength(2); // title and date inputs
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

    const inputs = screen.getAllByDisplayValue('');
    const dateInput = inputs.find(input => input.getAttribute('type') === 'date');
    
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

      await waitFor(() => {
        expect(dateInput).toHaveValue('2024-12-31');
      });
    }
  });

  it('submits form with valid data', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    const inputs = screen.getAllByDisplayValue('');
    const dateInput = inputs.find(input => input.getAttribute('type') === 'date');
    const submitButton = screen.getByRole('button', { name: 'TODO を追加' });

    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
    }
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

  it('handles form submission correctly', async () => {
    render(
      <Wrapper>
        <TodoForm />
      </Wrapper>
    );

    const titleInput = screen.getByPlaceholderText('TODO のタイトルを入力...');
    const form = titleInput.closest('form');
    
    // Add title to enable form submission
    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });
    
    // Mock form submission event
    const mockEvent = {
      preventDefault: vi.fn(),
      target: form,
    };
    
    if (form) {
      fireEvent.submit(form);
      // Since the form should prevent default browser submission and use tRPC instead
      expect(mockMutate).toHaveBeenCalled();
    }
  });
});