"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnFilter } from "@/components/ui/column-filter"
import { trpc } from "@/lib/trpc/client"
import type { UserWithAppsAndRoles } from "@/lib/types"

export const columns: ColumnDef<UserWithAppsAndRoles>[] = [
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
    accessorKey: "user_id",
    header: ({ column, table }) => {
      // Get all unique user IDs from the data
      const allUserIds = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => String(row.getValue("user_id")))
        )
      ).sort()

      const userIdOptions = allUserIds.map((id) => ({
        label: id,
        value: id,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {userIdOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="User ID"
              options={userIdOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("user_id")}</div>,
    filterFn: (row, id, value) => {
      const userId = String(row.getValue(id))
      return value.includes(userId)
    },
  },
  {
    accessorKey: "name",
    header: ({ column, table }) => {
      // Get all unique names from the data
      const allNames = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => row.getValue("name") as string)
        )
      ).sort()

      const nameOptions = allNames.map((name) => ({
        label: name,
        value: name,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {nameOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Name"
              options={nameOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string
      return value.includes(name)
    },
  },
  {
    accessorKey: "email",
    header: ({ column, table }) => {
      // Get all unique emails from the data
      const allEmails = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => row.getValue("email") as string)
        )
      ).sort()

      const emailOptions = allEmails.map((email) => ({
        label: email,
        value: email,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {emailOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Email"
              options={emailOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    filterFn: (row, id, value) => {
      const email = row.getValue(id) as string
      return value.includes(email)
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column, table }) => {
      // Get all unique creation dates from the data for filtering
      const allDates = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => {
              const dateStr = row.getValue("created_at") as string
              return new Date(dateStr).toDateString()
            })
        )
      ).sort()

      const dateOptions = allDates.map((date) => ({
        label: date,
        value: date,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {dateOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Created Date"
              options={dateOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => {
      const dateStr = row.getValue("created_at") as string
      const date = new Date(dateStr)
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const dateStr = row.getValue(id) as string
      const rowDate = new Date(dateStr).toDateString()
      return value.includes(rowDate)
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId) as string)
      const dateB = new Date(rowB.getValue(columnId) as string)
      return dateA.getTime() - dateB.getTime()
    },
  },
  {
    accessorKey: "apps",
    header: ({ column, table }) => {
      // Get all unique app names from the data
      const allApps = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.flatMap((row) => row.getValue("apps") as string[])
        )
      ).sort()

      const appOptions = allApps.map((app) => ({
        label: app,
        value: app,
      }))

      return (
        <div className="flex items-center space-x-2">
          <span>Apps</span>
          {appOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Apps"
              options={appOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => {
      const apps = row.getValue("apps") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {apps.map((app, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
            >
              {app}
            </span>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const apps = row.getValue(id) as string[]
      return value.some((selectedApp: string) => apps.includes(selectedApp))
    },
  },
  {
    accessorKey: "roles",
    header: ({ column, table }) => {
      // Get all unique role names from the data
      const allRoles = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.flatMap((row) => row.getValue("roles") as string[])
        )
      ).sort()

      const roleOptions = allRoles.map((role) => ({
        label: role,
        value: role,
      }))

      return (
        <div className="flex items-center space-x-2">
          <span>Roles</span>
          {roleOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Roles"
              options={roleOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
            >
              {role}
            </span>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as string[]
      return value.some((selectedRole: string) => roles.includes(selectedRole))
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original
      
      return <UserActions user={user} />
    },
  },
]

function UserActions({ user }: { user: UserWithAppsAndRoles }) {
  const router = useRouter()
  const utils = trpc.useContext()
  
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
    },
  })

  const handleEdit = () => {
    router.push(`/users/edit/${user.user_id}`)
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteMutation.mutateAsync({ user_id: user.user_id })
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
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