import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="text-blue-600 font-bold text-xl">
                            HealthcareSync
                        </Link>
                        <p className="mt-2 text-sm text-gray-500">
                            Streamlining healthcare management for better patient care.
                        </p>
                        <div className="mt-4 flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <div className="col-span-1">
                        <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                            Solutions
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link to="/patients" className="text-sm text-gray-500 hover:text-gray-700">
                                    Patient Management
                                </Link>
                            </li>
                            <li>
                                <Link to="/appointments" className="text-sm text-gray-500 hover:text-gray-700">
                                    Appointment Scheduling
                                </Link>
                            </li>
                            <li>
                                <Link to="/billing" className="text-sm text-gray-500 hover:text-gray-700">
                                    Billing & Insurance
                                </Link>
                            </li>
                            <li>
                                <Link to="/telemedicine" className="text-sm text-gray-500 hover:text-gray-700">
                                    Telemedicine
                                </Link>
                            </li>
                            <li>
                                <Link to="/analytics" className="text-sm text-gray-500 hover:text-gray-700">
                                    Analytics & Reporting
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="col-span-1">
                        <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                            Support
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link to="/help" className="text-sm text-gray-500 hover:text-gray-700">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-sm text-gray-500 hover:text-gray-700">
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="/training" className="text-sm text-gray-500 hover:text-gray-700">
                                    Training Resources
                                </Link>
                            </li>
                            <li>
                                <Link to="/system-status" className="text-sm text-gray-500 hover:text-gray-700">
                                    System Status
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="col-span-1">
                        <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                            Legal
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/hipaa" className="text-sm text-gray-500 hover:text-gray-700">
                                    HIPAA Compliance
                                </Link>
                            </li>
                            <li>
                                <Link to="/security" className="text-sm text-gray-500 hover:text-gray-700">
                                    Security Practices
                                </Link>
                            </li>
                            <li>
                                <Link to="/accessibility" className="text-sm text-gray-500 hover:text-gray-700">
                                    Accessibility
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="flex flex-col md:flex-row justify-between">
                        <p className="text-sm text-gray-500">
                            &copy; {currentYear} HealthcareSync. All rights reserved.
                        </p>
                        <p className="text-sm text-gray-500 mt-2 md:mt-0">
                            <span className="inline-flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                                HIPAA Compliant
                            </span>
                            <span className="mx-2">|</span>
                            <span className="inline-flex items-center">
                                <svg className="h-5 w-5 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                                Secure & Encrypted
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 