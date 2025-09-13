"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnFilter } from "@/components/ui/column-filter"
import { trpc } from "@/lib/trpc/client"
import type { TodoWithAuditLogsSerialized } from "@/server/db/schema"

export const columns: ColumnDef<TodoWithAuditLogsSerialized>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column, table }) => {
      // Get all unique titles from the data
      const allTitles = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => row.getValue("title") as string)
        )
      ).sort()

      const titleOptions = allTitles.map((title) => ({
        label: title,
        value: title,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {titleOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Title"
              options={titleOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    filterFn: (row, id, value) => {
      const title = row.getValue(id) as string
      return value.includes(title)
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column, table }) => {
      // Get all unique due dates from the data
      const allDueDates = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => {
              const date = row.getValue("due_date") as string | null
              return date || "No due date"
            })
        )
      ).sort()

      const dueDateOptions = allDueDates.map((date) => ({
        label: date === "No due date" ? "No due date" : date,
        value: date === "No due date" ? null : date,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {dueDateOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Due Date"
              options={dueDateOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("due_date") as string | null
      return <div>{date || "No due date"}</div>
    },
    filterFn: (row, id, value) => {
      const date = row.getValue(id) as string | null
      return value.includes(date)
    },
  },
  {
    accessorKey: "done_flag",
    header: ({ column, table }) => {
      const statusOptions = [
        { label: "Completed", value: true },
        { label: "Pending", value: false },
      ]

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <ColumnFilter
            column={column}
            title="Status"
            options={statusOptions}
          />
        </div>
      )
    },
    cell: ({ row }) => {
      const isDone = row.getValue("done_flag") as boolean
      return (
        <div className="flex items-center">
          {isDone ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">Completed</span>
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4 text-orange-600" />
              <span className="text-orange-600">Pending</span>
            </>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const isDone = row.getValue(id) as boolean
      return value.includes(isDone)
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string)
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const todo = row.original
      
      return <TodoActions todo={todo} />
    },
  },
]

function TodoActions({ todo }: { todo: TodoWithAuditLogsSerialized }) {
  const router = useRouter()
  const utils = trpc.useContext()
  
  const toggleMutation = trpc.todo.toggle.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate()
    },
  })

  const deleteMutation = trpc.todo.delete.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate()
    },
  })

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync({ id: todo.id })
    } catch (error) {
      console.error("Error toggling todo:", error)
    }
  }

  const handleEdit = () => {
    router.push(`/edit/${todo.id}`)
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this todo?")) {
      try {
        await deleteMutation.mutateAsync({ id: todo.id })
      } catch (error) {
        console.error("Error deleting todo:", error)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={todo.done_flag ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={toggleMutation.isLoading}
      >
        {todo.done_flag ? "Completed" : "Mark Done"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleteMutation.isLoading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}