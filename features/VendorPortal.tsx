
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetVendorProfile, dalSubmitVendorApplication } from '../services/dataAccessLayer';
import { VendorApplication } from '../types';

export const VendorPortal: React.FC = () => {
    const [vendor, setVendor] = useState<VendorApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [email, setEmail] = useState('');
    const [insuranceFile, setInsuranceFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const profile = await dalGetVendorProfile();
        setVendor(profile);
        if (profile.status !== 'NOT_APPLIED') {
            setCompanyName(profile.companyName);
            setTaxId(profile.taxId);
            setEmail(profile.contactEmail);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInsuranceFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !taxId || !email || (!insuranceFile && vendor?.status === 'NOT_APPLIED')) {
            alert("All fields, including Liability Insurance, are required.");
            return;
        }

        setSubmitting(true);

        try {
            let fileData = undefined;
            if (insuranceFile) {
                // Mock File Read
                fileData = {
                    name: insuranceFile.name,
                    data: 'base64_mock_content'
                };
            }

            const updated = await dalSubmitVendorApplication({
                companyName,
                taxId,
                contactEmail: email
            }, fileData);

            setVendor(updated);
            alert("Application Submitted! Status: PENDING review.");
        } catch (e) {
            console.error(e);
            alert("Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-10 animate-pulse text-neon-cyan">Loading Vendor Data...</div>;

    const isApplied = vendor?.status !== 'NOT_APPLIED';

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Vendor Portal</h2>
                    <p className="text-gray-400">Manage your business profile and compliance documentation.</p>
                </div>
                <div className="flex items-center gap-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                         vendor?.status === 'APPROVED' ? 'bg-green-500/20 border-green-500 text-green-400' :
                         vendor?.status === 'PENDING' ? 'bg-orange-500/20 border-orange-500 text-orange-400' :
                         vendor?.status === 'REJECTED' ? 'bg-red-500/20 border-red-500 text-red-400' :
                         'bg-gray-500/20 border-gray-500 text-gray-400'
                     }`}>
                         STATUS: {vendor?.status}
                     </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Form */}
                <div className="lg:col-span-2">
                    <GlassCard className="border-neon-cyan/30">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50">
                                <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {isApplied ? 'Application Details' : 'New Vendor Application'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Company Name</label>
                                    <input 
                                        type="text" 
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        disabled={isApplied}
                                        className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                        placeholder="Enter business name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Tax ID / EIN</label>
                                    <input 
                                        type="text" 
                                        value={taxId}
                                        onChange={(e) => setTaxId(e.target.value)}
                                        disabled={isApplied}
                                        className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                        placeholder="XX-XXXXXXX"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Business Email</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isApplied}
                                    className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                    placeholder="contact@company.com"
                                />
                            </div>

                            <div className={`p-4 rounded-xl border border-dashed transition-all ${insuranceFile || vendor?.insuranceDoc ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/5 border-red-500/30'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-white">
                                        <svg className="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        Liability Insurance Certificate
                                        <span className="text-[10px] bg-red-500 text-white px-1 rounded ml-2">REQUIRED</span>
                                    </label>
                                    {vendor?.insuranceDoc?.verified && (
                                        <span className="text-[10px] text-green-400 font-mono">VERIFIED</span>
                                    )}
                                </div>
                                
                                {isApplied && vendor?.insuranceDoc ? (
                                    <div className="flex items-center gap-3 bg-black/30 p-2 rounded">
                                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white truncate">{vendor.insuranceDoc.fileName}</div>
                                            <div className="text-[10px] text-gray-500">Uploaded: {new Date(vendor.insuranceDoc.uploadedAt).toLocaleDateString()}</div>
                                        </div>
                                        <button type="button" className="text-xs text-neon-cyan hover:underline">View</button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-400 mb-3">
                                            Upload your General Liability Insurance documentation (PDF, JPG). Must be valid for the current fiscal year.
                                        </p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                accept=".pdf,.jpg,.png" 
                                                className="hidden" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm text-white transition-colors"
                                            >
                                                Select Document
                                            </button>
                                            {insuranceFile && (
                                                <span className="flex items-center text-sm text-neon-cyan animate-pulse">
                                                    {insuranceFile.name}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isApplied && (
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {submitting ? (
                                        <>Processing...</>
                                    ) : (
                                        <>Submit Application</>
                                    )}
                                </button>
                            )}
                            
                            {isApplied && vendor?.status === 'PENDING' && (
                                <div className="text-center text-sm text-orange-400 mt-4 bg-orange-500/10 p-2 rounded">
                                    Your application is currently under review by the Architex Compliance Team.
                                </div>
                            )}
                        </form>
                    </GlassCard>
                </div>

                {/* Info / Benefits Sidebar */}
                <div className="space-y-6">
                    <GlassCard title="Vendor Benefits">
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Access to Enterprise Bounties (>500 Pi)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Verified Merchant Badge</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Reduced Platform Fees (3%)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Direct Treasury Payouts</span>
                            </li>
                        </ul>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-blue-900/40 to-black">
                        <h4 className="font-bold text-white mb-2">Insurance Requirements</h4>
                        <p className="text-xs text-gray-400 mb-4">
                            To ensure platform safety, all vendors must carry valid General Liability Insurance with a minimum coverage of $1,000,000 (or Pi equivalent).
                        </p>
                        <div className="text-[10px] text-gray-500 font-mono">
                            REF: POLICY-2024-VEND-01
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
