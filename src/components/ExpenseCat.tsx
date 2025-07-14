import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Download, PieChart, Edit2, Check, X, Plus, Trash2, Settings, RefreshCw, BanknoteArrowUp, BanknoteArrowDown } from 'lucide-react';
import Papa from 'papaparse';

type Expense = {
  id: number,
  date: string,
  description: string,
  sousDescription: string,
  montant: number,
  type: string,
  category: string
}

const columnIndexes = {
  filter: 0,
  date: 1,
  description: 2,
  sousDescription: 3,
  etat: 4,
  type: 5,
  montant: 6
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Alimentation': 'bg-green-100 text-green-800',
    'Transport': 'bg-blue-100 text-blue-800',
    'Logement/Maison': 'bg-purple-100 text-purple-800',
    'Télécommunications': 'bg-orange-100 text-orange-800',
    'Assurance': 'bg-red-100 text-red-800',
    'Santé/Pharmacie': 'bg-pink-100 text-pink-800',
    'Loisirs/Sport': 'bg-yellow-100 text-yellow-800',
    'Achats en ligne': 'bg-indigo-100 text-indigo-800',
    'Alcool': 'bg-amber-100 text-amber-800',
    'Éducation': 'bg-cyan-100 text-cyan-800',
    'Voyage': 'bg-emerald-100 text-emerald-800',
    'Frais bancaires': 'bg-rose-100 text-rose-800',
    'Divers': 'bg-gray-100 text-gray-800',
    'Non catégorisé': 'bg-slate-100 text-slate-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};


const months: {value: string, label: string}[] = [
  {
    value: 'Janvier',
    label: 'Janvier 2025',
  },
  {
    value: 'Février',
    label: 'Février 2025',
  }
]

const ExpenseCategorizer = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingIndex, setEditingIndex] = useState<number>();
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToEdit, setCategoryToEdit] = useState('');
  const [sheetsData, setSheetsData] = useState<Record<'data' | 'properties', any>[]>()
  // Catégories prédéfinies basées sur l'analyse de vos données
  const [predefinedCategories, setPredefinedCategories] = useState<Record<string, string[]>>({
    'Alimentation': ['metro', 'premiere moisson', 'fruiterie soleil', 'coop hec', 'costco', 'maxi supermarkets', 'marche branche dolivier', 'fromagerie du marche', 'bagel st lo', 'messorem', 'juste doner', 'tim hortons', 'cafe il panino', 'cafe lili & oli', 'restaurant ajit palace', 'brulerie balance coffe', 'monoprix aix mirabeau', 'le forum'],
    'Transport': ['shell', 'mobil', 'chrono recharge opus', 'stm', 'communauto', 'uber'],
    'Logement/Maison': ['ikea', 'the home depot', 'rona home supply', 'costway', 'rugsusa', 'canadian tire', 'dollarama'],
    'Télécommunications': ['videotron', 'google one', 'youtube'],
    'Assurance': ['sonnet insurance'],
    'Santé/Pharmacie': ['jean coutu'],
    'Loisirs/Sport': ['crossfit', 'ski mont blanc', 'decathlon', 'loisirs montreal', 'ls kayak sans frontie'],
    'Achats en ligne': ['amazon', 'amazon prime', 'nvidia'],
    'Alcool': ['saq'],
    'Éducation': ['udem sae cesar'],
    'Voyage': ['eskimo travel', 'mars t1 inter', 'relay', 'djerroud', 'interm calao', 'tabac place forb'],
    'Frais bancaires': ['interets sur avance de fo', 'interets sur achats', 'frais annuels'],
    'Divers': ['couche tard', 'mat & max wellin']
  });

  // Fonction pour catégoriser automatiquement
  const categorizeExpense = (description: string) => {
    const desc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(predefinedCategories)) {
      if (keywords.some(keyword => desc.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return 'Non catégorisé';
  };

  const updateCategory = (index: number, newCategory: string) => {
    const updated = [...expenses];
    updated[index].category = newCategory;
    setExpenses(updated);
    setEditingIndex(undefined);
  };

  const addNewCategory = () => {
    if (newCategoryName.trim() && !predefinedCategories[newCategoryName.trim()]) {
      setPredefinedCategories(prev => ({
        ...prev,
        [newCategoryName.trim()]: []
      }));
      setNewCategoryName('');
    }
  };

  const deleteCategory = (categoryName: string) => {
    if (categoryName === 'Non catégorisé') return;

    // Réassigner les transactions de cette catégorie à "Non catégorisé"
    const updated = expenses.map(expense =>
      expense.category === categoryName
        ? { ...expense, category: 'Non catégorisé' }
        : expense
    );
    setExpenses(updated);

    // Supprimer la catégorie
    const newCategories = { ...predefinedCategories };
    delete newCategories[categoryName];
    setPredefinedCategories(newCategories);
  };

  const renameCategory = (oldName: string, newName: string) => {
    if (newName.trim() && oldName !== newName.trim() && !predefinedCategories[newName.trim()]) {
      // Mettre à jour les transactions
      const updated = expenses.map(expense =>
        expense.category === oldName
          ? { ...expense, category: newName.trim() }
          : expense
      );
      setExpenses(updated);

      // Mettre à jour les catégories
      const newCategories = { ...predefinedCategories };
      newCategories[newName.trim()] = newCategories[oldName];
      delete newCategories[oldName];
      setPredefinedCategories(newCategories);

      setCategoryToEdit('');
      setEditingCategoryName('');
    }
  };

  const addKeywordToCategory = (categoryName: string, keyword: string) => {
    if (keyword.trim()) {
      setPredefinedCategories(prev => ({
        ...prev,
        [categoryName]: [...(prev[categoryName] || []), keyword.trim().toLowerCase()]
      }));
    }
  };

  const removeKeywordFromCategory = (categoryName: string, keyword: string) => {
    setPredefinedCategories(prev => ({
      ...prev,
      [categoryName]: prev[categoryName].filter(k => k !== keyword)
    }));
  };

  const recategorizeAll = () => {
    const updated = expenses.map(expense => ({
      ...expense,
      category: categorizeExpense(expense.description)
    }));
    setExpenses(updated);
  };

  const exportData = () => {
    const csv = Papa.unparse(expenses.map(expense => ({
      Date: expense.date,
      Description: expense.description,
      'Sous-description': expense.sousDescription,
      Montant: expense.montant,
      Type: expense.type,
      Catégorie: expense.category
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'depenses_categorisees.csv');
    link.click();
  };

  const handleOnSelectMonth = (e: ChangeEvent<HTMLSelectElement>) => {
    if(!e.target.value) { return; }
    setIsProcessed(false)

    const sheet = sheetsData?.find((sheet: any) => sheet.properties.title === e.target.value)
    const processedData = sheet?.data[0].rowData
    .filter((row: any) => row.values[columnIndexes.description] && row.values[columnIndexes.description].formattedValue.trim() !== '')
    .map((row: any, index: number) => ({
      id: index,
      date: row.values[columnIndexes.date].formattedValue,
      description: row.values[columnIndexes.description].formattedValue.trim(),
      sousDescription: row.values[columnIndexes.sousDescription].formattedValue,
      montant: parseFloat(row.values[columnIndexes.montant].formattedValue) || 0,
      type: row.values[columnIndexes.type].formattedValue,
      category: categorizeExpense(row.values[columnIndexes.description].formattedValue)
    }));

    setExpenses(processedData)
    setIsProcessed(true)
  }

  const computeStats = (expenses: Expense[]) => {
    const categoryStats: Record<string, Record<string, number>> = {};
    let totalDebit = 0;
    let totalCredit = 0;

    expenses?.forEach(expense => {
      if (expense.type === 'Débit') {
        totalDebit += expense.montant;
        if (!categoryStats[expense.category]) {
          categoryStats[expense.category] = { total: 0, count: 0 };
        }
        categoryStats[expense.category].total += expense.montant;
        categoryStats[expense.category].count++;
      } else {
        totalCredit += Math.abs(expense.montant);
      }
    });

    return {
      categoryStats,
      totalDebit,
      totalCredit,
      netBalance: totalCredit - totalDebit
    };
  }

  const stats = useMemo(() => computeStats(expenses), [expenses])

  useEffect(() => {
    const fetchCSV = async () => {
      setIsProcessed(false)
      try {
        const client = window.gapi.client.getToken();
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/1Hhn2L79uE6B9tXg43SzB6wDHYPH3zEK4yHj1-1G3qDw?includeGridData=true', {
          headers: {
            Authorization: `Bearer ${client.access_token}`
          }
        })
        if(response.ok) {
          const data = await response.json();
          setSheetsData(data.sheets)
          setIsProcessed(true)
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchCSV()
  }, [])

  if (!isProcessed) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Traitement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catégoriseur de Dépenses</h1>
        <p className="text-gray-600">Données de juin 2025 - Carte Visa Infinite Passeport Banque Scotia</p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-lg">
          <select
          onChange={handleOnSelectMonth}
          id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            <option value="">Choisis un mois</option>
            {
              months.map((month) => (
                <option value={month.value} key={month.value}>{month.label}</option>
              ))
            }
          </select>
        </div>
      </div>


      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <BanknoteArrowUp className='text-white' />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Dépenses du mois</p>
              <p className="text-2xl font-bold text-red-900">{stats.totalDebit?.toFixed(2)} $</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <BanknoteArrowDown className='text-white' />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Crédits payés</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalCredit?.toFixed(2)} $</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PieChart className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Différence</p>
              <p className="text-2xl font-bold text-blue-900">{stats.netBalance?.toFixed(2)} $</p>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition par catégorie */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Répartition par catégorie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.categoryStats || {}).map(([category, data]: [string, any]) => (
            <div key={category} className="bg-white border border-slate-400 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                  {category}
                </span>
                <span className="text-sm text-gray-500">{data.count} transactions</span>
              </div>
              <p className="text-lg font-semibold">{data.total.toFixed(2)} $</p>
              <p className="text-sm text-gray-600">{((data.total / stats.totalDebit) * 100).toFixed(1)}% du total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={20} />
          Exporter CSV
        </button>
        <button
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Settings size={20} />
          Gérer les catégories
        </button>
        <button
          onClick={recategorizeAll}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <RefreshCw size={20} />
          Recatégoriser tout
        </button>
      </div>

      {/* Gestionnaire de catégories */}
      {showCategoryManager && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Gestionnaire de catégories</h2>

          {/* Ajouter une nouvelle catégorie */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Ajouter une nouvelle catégorie</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la catégorie"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
              />
              <button
                onClick={addNewCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste des catégories existantes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Catégories existantes</h3>
            {Object.entries(predefinedCategories).map(([categoryName, keywords]) => (
              <div key={categoryName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {categoryToEdit === categoryName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              renameCategory(categoryName, editingCategoryName);
                            }
                          }}
                        />
                        <button
                          onClick={() => renameCategory(categoryName, editingCategoryName)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToEdit('');
                            setEditingCategoryName('');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(categoryName)}`}>
                          {categoryName}
                        </span>
                        <button
                          onClick={() => {
                            setCategoryToEdit(categoryName);
                            setEditingCategoryName(categoryName);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  {categoryName !== 'Non catégorisé' && (
                    <button
                      onClick={() => deleteCategory(categoryName)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Mots-clés */}
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-2">Mots-clés de détection:</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeywordFromCategory(categoryName, keyword)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ajouter un mot-clé */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nouveau mot-clé"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        addKeywordToCategory(categoryName, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e: any) => {
                      const input = e.target.previousElementSibling;
                      addKeywordToCategory(categoryName, input.value);
                      input.value = '';
                    }}
                    className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des transactions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Transactions ({expenses?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses?.map((expense, index) => (
                <tr key={expense.id} className={expense.type === 'Crédit' ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-gray-500">{expense.sousDescription}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={expense.type === 'Crédit' ? 'text-green-600 font-medium' : 'text-red-600'}>
                      {expense.type === 'Crédit' ? '+' : ''}{expense.montant.toFixed(2)} $
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingIndex === index ? (
                      <select
                        value={expense.category}
                        onChange={(e) => updateCategory(index, e.target.value)}
                        className="rounded border-gray-300 text-sm"
                      >
                        {Object.keys(predefinedCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Non catégorisé">Non catégorisé</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingIndex === index ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingIndex(undefined)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingIndex(undefined)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategorizer;