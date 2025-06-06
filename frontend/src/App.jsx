
  import React, { useState, useEffect } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { Toaster } from "@/components/ui/toaster";
  import { useToast } from "@/components/ui/use-toast";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Select, SelectOption } from "@/components/ui/select";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
  import { ArrowRight, ArrowLeft, DollarSign, Percent, BarChart3, CheckCircle2, User, Building2, Mail, Briefcase, RefreshCw, Send } from "lucide-react";
  import axios from "axios";
  const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/37398243-f0ee-4770-8136-abe4548bfb2e/5de622544daf4ae48190e0115d8485f3.png";

  const PRODUCTS = [
    { id: "google-workspace", name: "Google Workspace", savingsRateLow: 10, savingsRateHigh: 20 },
    { id: "microsoft-office", name: "Microsoft Office", savingsRateLow: 10, savingsRateHigh: 20 },
    { id: "udemy", name: "Udemy", savingsRateLow: 10, savingsRateHigh: 20 },
    { id: "atlassian", name: "Atlassian", savingsRateLow: 10, savingsRateHigh: 20 },
  ];

  const initialFormData = {
    firstName: "",
    lastName: "",
    companyEmail: "",
    companyName: "",
    designation: "",
    selectedProduct: PRODUCTS[0].id,
    currentSpend: 1000,
  };

  const TARGET_EMAILS = "akapoor@revynox.com,ashish@revynox.com";

  function SavingsCalculator() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialFormData);
    const [savings, setSavings] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
      document.documentElement.classList.add('dark');
      return () => {
        document.documentElement.classList.remove('dark');
      }
    }, []);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (e) => {
      setFormData((prev) => ({ ...prev, selectedProduct: e.target.value }));
    };

    const validateStep1 = () => {
      const requiredFields = ["firstName", "lastName", "companyEmail", "companyName", "designation"];
      for (const field of requiredFields) {
        if (!formData[field]) {
          toast({ title: "Uh oh!", description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, variant: "destructive" });
          return false;
        }
      }
      if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
        toast({ title: "Invalid Email", description: "Please enter a valid company email.", variant: "destructive" });
        return false;
      }
      return true;
    };

    const validateStep2 = () => {
      if (!formData.selectedProduct || formData.currentSpend <= 0) {
        toast({ title: "Hold Up!", description: "Please select a product and enter a valid current spend.", variant: "destructive" });
        return false;
      }
      return true;
    };

    const nextStep = () => {
      if (step === 1 && validateStep1()) {
        setStep(2);
      } else if (step === 2 && validateStep2()) {
        calculateSavings();
        setStep(3);
      }
    };

    const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

    const calculateSavings = () => {
      const product = PRODUCTS.find(p => p.id === formData.selectedProduct);
      if (!product) return;

      const spend = parseFloat(formData.currentSpend);
      const lowSavings = (spend * product.savingsRateLow) / 100;
      const highSavings = (spend * product.savingsRateHigh) / 100;

      setSavings({
        low: Math.round(lowSavings),
        high: Math.round(highSavings),
        productName: product.name,
      });
      toast({ title: "Success!", description: "Savings calculated successfully!", className: "bg-green-600 text-white" });
    };
    
    const resetCalculator = () => {
      setFormData(initialFormData);
      setSavings(null);
      setStep(1);
      toast({ title: "Reset!", description: "Calculator has been reset." });
    };


    const handleSubmitAndSendEmail = async (e) => {

    //   if (!savings) {
    //     toast({ title: "Error", description: "Please calculate savings first.", variant: "destructive" });
    //     return;
    //   }

    //   const subject = `SaaS Savings Calculator Submission - ${formData.companyName}`;
    //   const body = `
    //     New Savings Calculation:

    //     Personal Details:
    //     First Name: ${formData.firstName}
    //     Last Name: ${formData.lastName}
    //     Company Email: ${formData.companyEmail}
    //     Company Name: ${formData.companyName}
    //     Designation: ${formData.designation}

    //     Product & Spend:
    //     Selected Product: ${savings.productName}
    //     Current Monthly Spend: $${formData.currentSpend}

    //     Calculated Savings:
    //     Lower Estimate: $${savings.low} per month
    //     Higher Estimate: $${savings.high} per month

    //     ---
    //     This email was generated by the Revynox SaaS Savings Calculator.
    //   `;
    //   const mailtoLink = `mailto:${TARGET_EMAILS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    //   window.location.href = mailtoLink;
    //   toast({ title: "Redirecting...", description: "Opening your email client to send the details." });
    // 

    e.preventDefault();
    if (!savings) {
      toast({
        title: "Error",
        description: "Please calculate savings before submitting.",
        variant: "destructive",
      });
      return;
    }

      try {
        const response = await axios.post(
          "http://localhost:8000/api/companydetail",
          {
            ...formData,
            currentSpend: Number(formData.currentSpend),
            savingsLow: savings.low,
            savingsHigh: savings.high,
          }
        );
        
         //  console.log("Form data sent:", formData); // Changed console.log for clarity
        toast({ title: "Success!", description: response.data.message, className: "bg-green-600 text-white" });
        
      } catch (error) {
    //    alert(error.response?.data?.error || "Something went wrong");
        toast({ title: "Error", description: error.response?.data?.error || "Something went wrong", variant: "destructive" });
      }
    };


    const renderStep = () => {
      switch (step) {
        case 1:
          return (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                  Your Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">Tell us a bit about yourself and your company. All fields are required.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center text-foreground"><User className="mr-2 h-4 w-4 text-purple-500" />First Name *</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g., Jane" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center text-foreground"><User className="mr-2 h-4 w-4 text-purple-500" />Last Name *</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g., Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="flex items-center text-foreground"><Mail className="mr-2 h-4 w-4 text-purple-500" />Company Email *</Label>
                  <Input id="companyEmail" name="companyEmail" type="email" value={formData.companyEmail} onChange={handleChange} placeholder="e.g., jane.doe@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center text-foreground"><Building2 className="mr-2 h-4 w-4 text-purple-500" />Company Name *</Label>
                  <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g., Acme Corp" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="designation" className="flex items-center text-foreground"><Briefcase className="mr-2 h-4 w-4 text-purple-500" />Designation *</Label>
                  <Input id="designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g., Marketing Manager" required />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={nextStep} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </motion.div>
          );
        case 2:
          return (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-500">
                  Product & Spend
                </CardTitle>
                <CardDescription className="text-muted-foreground">Select the product and your current monthly spend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="selectedProduct" className="flex items-center text-foreground"><BarChart3 className="mr-2 h-4 w-4 text-green-500" />Product</Label>
                  <Select id="selectedProduct" name="selectedProduct" value={formData.selectedProduct} onChange={handleSelectChange}>
                    {PRODUCTS.map(product => (
                      <SelectOption key={product.id} value={product.id}>{product.name}</SelectOption>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSpend" className="flex items-center text-foreground"><DollarSign className="mr-2 h-4 w-4 text-green-500" />Current Monthly Spend: ${formData.currentSpend}</Label>
                  <Input 
                    id="currentSpend" 
                    name="currentSpend" 
                    type="number" 
                    value={formData.currentSpend} 
                    onChange={handleChange} 
                    min="1" 
                    max="1000000" 
                    step="50"
                    className="mt-2"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={prevStep} variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                  Calculate Savings <Percent className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </motion.div>
          );
        case 3:
          return (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
              className="space-y-6 text-center"
            >
              <CardHeader>
                <CardTitle className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
                  <CheckCircle2 className="inline-block mr-3 h-10 w-10 text-green-500" />
                  Your Potential Savings!
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Based on your current spend on {savings?.productName || "the selected product"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {savings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="p-6 rounded-xl savings-card-low text-white"
                    >
                      <p className="text-xl font-medium">Lower Estimate</p>
                      <p className="text-5xl font-bold my-2">${savings.low}</p>
                      <p className="text-sm opacity-80">per month</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="p-6 rounded-xl savings-card text-white"
                    >
                      <p className="text-xl font-medium">Higher Estimate</p>
                      <p className="text-5xl font-bold my-2">${savings.high}</p>
                      <p className="text-sm opacity-80">per month</p>
                    </motion.div>
                  </div>
                )}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-muted-foreground text-sm"
                >
                  These are estimated savings. Actual results may vary. Click below to send this information or start over.
                </motion.p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button onClick={resetCalculator} variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                  <RefreshCw className="mr-2 h-5 w-5" /> Start Over
                </Button>
                <Button onClick={handleSubmitAndSendEmail} className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                  <Send className="mr-2 h-5 w-5" /> Send Details
                </Button>
              </CardFooter>
            </motion.div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animated-gradient-bg">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mb-8 text-center flex flex-col items-center"
        >
          <img src={LOGO_URL} alt="Revynox Logo" className="h-16 mb-6" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            SaaS Savings <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">Calculator</span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-purple-200 max-w-xl mx-auto">
            Discover how much you could save by switching to our solutions!
          </p>
        </motion.div>
        
        <Card className="w-full max-w-2xl form-container card-gradient text-foreground shadow-2xl">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </Card>
        <Toaster />
        <footer className="mt-12 text-center text-purple-300 text-sm">
          <p>&copy; {new Date().getFullYear()} Revynox Technologies Inc. All rights reserved.</p>
          <p>
            <a href="https://www.revynox.com" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
              www.revynox.com
            </a>
          </p>
        </footer>
      </div>
    );
  }

  export default SavingsCalculator;
