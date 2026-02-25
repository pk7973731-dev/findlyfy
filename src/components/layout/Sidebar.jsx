import { LayoutGrid, Monitor, BookOpen, Key, Shirt, CreditCard, ShieldAlert } from 'lucide-react';

const categories = [
    { id: 'all', name: 'All Items', icon: LayoutGrid, active: true },
    { id: 'electronics', name: 'Electronics', icon: Monitor },
    { id: 'books', name: 'Books & Notes', icon: BookOpen },
    { id: 'keys', name: 'Keys', icon: Key },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
    { id: 'id-cards', name: 'ID Cards', icon: CreditCard },
];

export default function Sidebar() {
    return (
        <div className="w-64 flex-shrink-0 hidden lg:block animate-fade-up">
            {/* Categories Card */}
            <div className="glass-card rounded-2xl border border-slate-200 p-4 mb-6">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 px-3">
                    Categories
                </h3>
                <nav className="space-y-1">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.id}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${category.active
                                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                                    : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 border border-transparent'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${category.active ? 'text-brand-600' : 'text-slate-400'}`} />
                                {category.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Safety Guidelines Card */}
            <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 border border-slate-800">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <ShieldAlert className="w-5 h-5 text-brand-300" />
                        Need Help?
                    </div>
                    <p className="text-sm text-brand-100/80 mb-5 leading-relaxed">
                        Safety first! Always meet in public campus areas when exchanging items.
                    </p>
                    <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl backdrop-blur-sm transition-colors text-sm border border-white/20">
                        Safety Guidelines
                    </button>
                </div>
            </div>
        </div>
    );
}
