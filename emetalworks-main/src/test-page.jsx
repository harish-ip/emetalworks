import React from 'react';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Bhavya Fabrication Works - Test Page
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Styling Test</h2>
          <p className="text-gray-600 mb-4">
            This is a test to see if basic Tailwind CSS classes are working.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Test Button
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Service 1</h3>
            <p className="text-gray-600">Steel Railings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Service 2</h3>
            <p className="text-gray-600">Window Grills</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;
