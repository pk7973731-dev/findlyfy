import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, AlignLeft, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const categories = [
    'Electronics', 'Books & Notes', 'Keys', 'Clothing', 'ID Cards', 'Other'
];

export default function CreatePostForm({ session }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: 'lost', // 'lost' or 'found'
        title: '',
        category: '',
        location: '',
        description: '',
        image: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (!session?.user) return;

        setIsSubmitting(true);
        setError('');

        try {
            let imageUrl = null;

            // 1. Upload Image (if exists)
            if (formData.image) {
                const fileExt = formData.image.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(filePath, formData.image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // 2. Save Post Data
            const newPost = {
                user_id: session.user.id,
                type: formData.type,
                title: formData.title,
                category: formData.category,
                location: formData.location,
                description: formData.description,
                image_url: imageUrl,
                status: 'active'
            };

            const { error: insertError } = await supabase
                .from('posts')
                .insert(newPost);

            if (insertError) throw insertError;

            // 3. Navigate away on success
            navigate('/');
        } catch (err) {
            console.error('Error creating post:', err);
            setError(err.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full max-w-2xl mx-auto">

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Post an Item</h1>
                <p className="text-slate-600">Help the campus community by reporting lost or found items.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
                    {error}
                </div>
            )}

            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 rounded-full z-0 transition-all duration-300"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>

                {[1, 2, 3].map((num) => (
                    <div
                        key={num}
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= num
                            ? 'bg-brand-600 text-white ring-4 ring-white'
                            : 'bg-slate-200 text-slate-500 ring-4 ring-white'
                            }`}
                    >
                        {num}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div>

                    {/* Step 1: Basics */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                                What are you posting?
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => updateForm('type', 'lost')}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.type === 'lost'
                                        ? 'border-rose-500 bg-rose-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <span className={`block font-bold mb-1 ${formData.type === 'lost' ? 'text-rose-700' : 'text-slate-700'}`}>
                                        I Lost Something
                                    </span>
                                    <span className="text-xs text-slate-500">I am looking for an item I lost.</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateForm('type', 'found')}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.type === 'found'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <span className={`block font-bold mb-1 ${formData.type === 'found' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                        I Found Something
                                    </span>
                                    <span className="text-xs text-slate-500">I found an item and want to return it.</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => updateForm('title', e.target.value)}
                                    placeholder="e.g., Blue Hydro Flask"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => updateForm('category', cat)}
                                            className={`py-2 px-3 text-sm rounded-lg border font-medium transition-all ${formData.category === cat
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                                Where & What?
                            </h2>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {formData.type === 'lost' ? 'Where did you lose it?' : 'Where did you find it?'}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={(e) => updateForm('location', e.target.value)}
                                    placeholder="e.g., Student Union, 2nd Floor"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-slate-400" />
                                        Detailed Description
                                    </span>
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => updateForm('description', e.target.value)}
                                    placeholder="Any distinct features? Scratches, stickers, color?"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Image & Submit */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                                Add a Photo
                            </h2>

                            <div
                                onClick={() => document.getElementById('imageUpload').click()}
                                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">Click to upload an image</h3>
                                <p className="text-xs text-slate-500">JPG, PNG, GIF up to 5MB</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="imageUpload"
                                onChange={(e) => {
                                    if (e.target.files[0]) updateForm('image', e.target.files[0]);
                                }}
                            />

                            {formData.image && (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium truncate">{formData.image.name} attached!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${step === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" /> Back
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={
                                    (step === 1 && (!formData.title || !formData.category)) ||
                                    (step === 2 && (!formData.location || !formData.description))
                                }
                                className="flex items-center gap-2 px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Next Step <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Item'}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
