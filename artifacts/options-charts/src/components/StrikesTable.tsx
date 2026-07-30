import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StrikesTable({ data, loading, spotPrice }: { data: any[]; loading: boolean; spotPrice?: number }) {
  const [sorting, setSorting] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: any[] = [
    { accessorKey: "strike", header: "Strike", cell: ({ row }: any) => <span className="font-mono font-medium">${row.original.strike.toFixed(2)}</span> },
    { accessorKey: "callBid", header: "Call Bid", cell: ({ row }: any) => row.original.callBid?.toFixed(2) ?? "-" },
    { accessorKey: "callAsk", header: "Call Ask", cell: ({ row }: any) => row.original.callAsk?.toFixed(2) ?? "-" },
    { accessorKey: "callVolume", header: "Call Vol", cell: ({ row }: any) => row.original.callVolume?.toLocaleString() ?? "-" },
    { accessorKey: "callOpenInterest", header: "Call OI", cell: ({ row }: any) => row.original.callOpenInterest?.toLocaleString() ?? "-" },
    { accessorKey: "callIV", header: "Call IV", cell: ({ row }: any) => row.original.callIV ? `${row.original.callIV.toFixed(1)}%` : "-" },
    { accessorKey: "putIV", header: "Put IV", cell: ({ row }: any) => row.original.putIV ? `${row.original.putIV.toFixed(1)}%` : "-" },
    { accessorKey: "putOpenInterest", header: "Put OI", cell: ({ row }: any) => row.original.putOpenInterest?.toLocaleString() ?? "-" },
    { accessorKey: "putVolume", header: "Put Vol", cell: ({ row }: any) => row.original.putVolume?.toLocaleString() ?? "-" },
    { accessorKey: "putBid", header: "Put Bid", cell: ({ row }: any) => row.original.putBid?.toFixed(2) ?? "-" },
    { accessorKey: "putAsk", header: "Put Ask", cell: ({ row }: any) => row.original.putAsk?.toFixed(2) ?? "-" },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const closestStrike = data?.length > 0 && spotPrice ? data.reduce((prev, curr) => 
    Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev
  )?.strike : null;

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base flex flex-wrap justify-between items-center gap-4 font-semibold">
          <span>Strikes Data</span>
          <Input
            placeholder="Search strikes..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-[200px] h-9 text-sm font-medium"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => {
                    const isATM = row.original.strike === closestStrike;
                    return (
                      <TableRow key={row.id} className={isATM ? "bg-muted/80 font-medium" : ""}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
