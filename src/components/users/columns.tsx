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
    accessorKey: "username",
    header: ({ column, table }) => {
      // Get all unique usernames from the data
      const allUsernames = Array.from(
        new Set(
          table
            .getFilteredRowModel()
            .rows.map((row) => row.getValue("username") as string)
        )
      ).sort()

      const usernameOptions = allUsernames.map((username) => ({
        label: username,
        value: username,
      }))

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          {usernameOptions.length > 0 && (
            <ColumnFilter
              column={column}
              title="Username"
              options={usernameOptions}
            />
          )}
        </div>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("username")}</div>,
    filterFn: (row, id, value) => {
      const username = row.getValue(id) as string
      return value.includes(username)
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