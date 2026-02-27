import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle, ImageIcon } from "lucide-react";

interface ProofUploadProps {
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export default function ProofUpload({ value, onChange, required }: ProofUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image file (JPG, PNG, WEBP, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `proof-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("payment-proofs").upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(data.path);
      onChange(urlData.publicUrl);
      toast.success("Proof uploaded successfully");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="flex items-center gap-1">
        <ImageIcon className="h-3.5 w-3.5" />
        Payment Proof {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="mt-1">
        <Input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="cursor-pointer"
        />
        {uploading && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Upload className="h-3 w-3 animate-pulse" /> Uploading...
          </p>
        )}
        {value && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Proof attached
            </p>
            <img src={value} alt="Payment proof" className="max-h-32 rounded-md border border-border" />
          </div>
        )}
      </div>
    </div>
  );
}
