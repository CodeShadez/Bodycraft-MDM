import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type Invoice, type InsertInvoice } from "@shared/schema";
import { Search, Plus, Download, Trash2, DollarSign, FileText, Clock, CheckCircle, X, Upload, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { getSignedUploadUrl } from "@/lib/objectStorage";

export default function FinancialOverview() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      amount: "0",
      category: "hardware",
      vendorName: "",
      paymentStatus: "unpaid",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      return await apiRequest('POST', '/api/invoices', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setCreateDialogOpen(false);
      form.reset();
      setUploadedFileUrl("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest('PATCH', `/api/invoices/${id}`, { paymentStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
  });


  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || invoice.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidAmount = invoices.filter(inv => inv.paymentStatus === "paid").reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = invoices.filter(inv => inv.paymentStatus === "unpaid" || inv.paymentStatus === "pending").reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter(inv => inv.paymentStatus === "paid").length;
  const pendingCount = invoices.filter(inv => inv.paymentStatus === "unpaid" || inv.paymentStatus === "pending").length;

  const onSubmit = (data: InsertInvoice) => {
    const invoiceData = {
      ...data,
      fileUrl: uploadedFileUrl || undefined,
    };
    createMutation.mutate(invoiceData);
  };

  const handleFileUpload = async () => {
    const fileName = `invoice-${Date.now()}`;
    return await getSignedUploadUrl(fileName);
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = uploadedFile.uploadURL.split('?')[0]; // Remove query params
      setUploadedFileUrl(fileUrl);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      unpaid: { variant: "destructive" as const, icon: X, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
      pending: { variant: "secondary" as const, icon: Clock, className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
      overdue: { variant: "destructive" as const, icon: X, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage invoices and track financial data</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-invoice">
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-0" data-testid="card-total-amount">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90" data-testid="text-total-amount">₹{totalAmount.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">{totalInvoices} total invoices</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0" data-testid="card-paid-amount">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90" data-testid="text-paid-amount">₹{paidAmount.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">{paidCount} paid invoices</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0" data-testid="card-pending-amount">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90" data-testid="text-pending-amount">₹{pendingAmount.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} pending invoices</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0" data-testid="card-invoice-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90" data-testid="text-invoice-count">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All time records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, vendor, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 backdrop-blur-sm border-border/40"
                data-testid="input-search-invoice"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px] backdrop-blur-sm border-border/40" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="repairs">Repairs</SelectItem>
                <SelectItem value="internet">Internet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px] backdrop-blur-sm border-border/40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="glass-card border-0">
        <CardContent className="p-0 table-container-stable">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Details</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium">Loading invoices...</p>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium mb-1">No invoices found</p>
                    <p className="text-sm">
                      {searchTerm || categoryFilter !== "all" || statusFilter !== "all" 
                        ? "Try adjusting your filters" 
                        : "Create your first invoice to get started"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.flatMap((invoice) => {
                  const isExpanded = expandedInvoiceId === invoice.id;
                  const rows = [
                    <TableRow
                      key={`main-${invoice.id}`}
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                      className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      {/* Invoice Details with Chevron */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full group-hover:bg-muted transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-foreground" data-testid={`text-invoice-number-${invoice.id}`}>
                                {invoice.invoiceNumber}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell className="py-3 px-3">
                        <span className="text-sm font-medium truncate">
                          {invoice.vendorName || "—"}
                        </span>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3 px-3">
                        <span className="text-sm font-medium capitalize">
                          {invoice.category}
                        </span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3 px-3">
                        <span className="text-sm font-bold">
                          ₹{parseFloat(invoice.amount).toLocaleString('en-IN')}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            invoice.paymentStatus === 'paid' ? 'bg-green-500' :
                            invoice.paymentStatus === 'pending' ? 'bg-yellow-500' :
                            invoice.paymentStatus === 'overdue' ? 'bg-red-500' :
                            'bg-red-400'
                          }`} />
                          <span className="text-sm font-medium capitalize" data-testid={`text-status-${invoice.id}`}>
                            {invoice.paymentStatus}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ];

                  if (isExpanded) {
                    rows.push(
                      <TableRow key={`expanded-${invoice.id}`} className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={5} className="p-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Column 1 - Invoice Information */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Invoice Information</h4>
                              <div>
                                <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                                <p className="text-sm font-medium mt-1">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <p className="text-sm font-medium mt-1">{format(new Date(invoice.invoiceDate), "MMMM dd, yyyy")}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Category</Label>
                                <p className="text-sm font-medium mt-1 capitalize">{invoice.category}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Vendor</Label>
                                <p className="text-sm font-medium mt-1">{invoice.vendorName || "—"}</p>
                              </div>
                            </div>

                            {/* Column 2 - Payment Details */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Payment Details</h4>
                              <div>
                                <Label className="text-xs text-muted-foreground">Amount</Label>
                                <p className="text-sm font-bold mt-1">₹{parseFloat(invoice.amount).toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Payment Status</Label>
                                <div className="mt-1">
                                  {getStatusBadge(invoice.paymentStatus)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <p className="text-sm mt-1">{invoice.description || "—"}</p>
                              </div>
                            </div>

                            {/* Column 3 - File & Metadata */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Attachments & Info</h4>
                              <div>
                                <Label className="text-xs text-muted-foreground">Attached File</Label>
                                {invoice.fileUrl ? (
                                  <div className="mt-1">
                                    <a
                                      href={invoice.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-3 w-3" />
                                      Download File
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-sm mt-1 text-muted-foreground">No file attached</p>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Created At</Label>
                                <p className="text-sm mt-1">{invoice.createdAt ? format(new Date(invoice.createdAt), "MMM dd, yyyy HH:mm") : "—"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                                <p className="text-sm mt-1">{invoice.updatedAt ? format(new Date(invoice.updatedAt), "MMM dd, yyyy HH:mm") : "—"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions Section */}
                          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/50">
                            {/* Status Change Buttons - Only show relevant options based on current status */}
                            {invoice.paymentStatus !== "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    id: invoice.id,
                                    status: "paid"
                                  });
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                data-testid={`button-mark-paid-${invoice.id}`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </Button>
                            )}
                            
                            {invoice.paymentStatus !== "pending" && invoice.paymentStatus !== "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    id: invoice.id,
                                    status: "pending"
                                  });
                                }}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                data-testid={`button-mark-pending-${invoice.id}`}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Mark as Pending
                              </Button>
                            )}
                            
                            {invoice.paymentStatus !== "unpaid" && invoice.paymentStatus !== "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    id: invoice.id,
                                    status: "unpaid"
                                  });
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                data-testid={`button-mark-unpaid-${invoice.id}`}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as Unpaid
                              </Button>
                            )}

                            {/* Download File Button */}
                            {invoice.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(invoice.fileUrl!, '_blank');
                                }}
                                data-testid={`button-download-${invoice.id}`}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download File
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(invoice);
                                setDeleteDialogOpen(true);
                              }}
                              data-testid={`button-delete-${invoice.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Invoice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return rows;
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add New Invoice</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new invoice record with optional file attachment
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Invoice Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="INV-2024-001" className="bg-white dark:bg-gray-900" data-testid="input-invoice-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Invoice Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="bg-white dark:bg-gray-900" data-testid="input-invoice-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Vendor</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Dell Technologies" className="bg-white dark:bg-gray-900" data-testid="input-vendor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="50000" 
                          className="bg-white dark:bg-gray-900" 
                          data-testid="input-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-900" data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Payment Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-900" data-testid="select-payment-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Description *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Invoice description" className="bg-white dark:bg-gray-900" data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel className="text-gray-700 dark:text-gray-300">Invoice File (Optional)</FormLabel>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleFileUpload}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Invoice File
                </ObjectUploader>
                {uploadedFileUrl && (
                  <p className="text-sm text-green-600 dark:text-green-400">File uploaded successfully</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    form.reset();
                    setUploadedFileUrl("");
                  }}
                  className="border-gray-300 dark:border-gray-600"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Invoice</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedInvoice(null);
              }}
              className="border-gray-300 dark:border-gray-600"
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
