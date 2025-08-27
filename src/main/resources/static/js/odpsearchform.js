document.addEventListener('alpine:init', () => {
    Alpine.data('odpApp', function () {
        return {
            loading: false,
            validationMessage: '',
            searchDTO: {
                client: null,
                distributionManagers: []
            },
            distributionManagers: [],
            results: [],
            getSelectedDistributionManagerIds: null,

            async init() {
            await this.fetchDistributionManagers();
            this.initializeDistributionManagerMultiSelect();

                const clientInput = document.getElementById('client');
                if (clientInput) {
                    clientInput.focus();
                }

            },

            async fetchDistributionManagers() {
               this.loading = true;
               try {
                   this.distributionManagers = await CultDataReportLib.fetchDistributionManagers();
               } catch (error) {
                   console.error('Error:', error);
                   this.validationMessage = error.message;
               } finally {
                   this.loading = false;
               }
            },

            initializeDistributionManagerMultiSelect() {
               this.$nextTick(() => {
                 setTimeout(() => {
                   if (typeof MultiSelectLib !== 'undefined' && MultiSelectLib.initMultiSelect) {
                       const dmData = [
                           { value: "all", label: "All Distribution Managers", isAll: true },
                           ...this.distributionManagers.map(dm => ({
                               value: dm.id.toString(),
                               label: dm.name
                           }))
                       ];

                       this.getSelectedDistributionManagerIds = MultiSelectLib.initMultiSelect({
                           data: dmData,
                           containerId: "selectBoxDistributionManager"
                       });

                       this.searchDTO.distributionManagers = this.distributionManagers.map(dm => dm.id.toString());
                   }
                   }, 100);
               });
            },

            // Perform search with given inputs
            async searchOdp() {

                if (this.getSelectedDistributionManagerIds) {
                   const selectedLabels = this.getSelectedDistributionManagerIds();
                   const selectedIds = this.distributionManagers
                       .filter(dm => selectedLabels.includes(dm.name))
                       .map(dm => dm.id.toString());

                   this.searchDTO.distributionManagers = selectedIds;
                }


                if (!this.searchDTO.client && this.searchDTO.distributionManagers.length === 0) {
                    this.validationMessage = 'Please enter either a Client ID or one Distribution Manager';
                    return;
                }

                this.validationMessage = '';
                this.loading = true;

                try {
                    const response = await fetch('/odp/api/odp-result', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            client: this.searchDTO.client,
                            distributionManagers: this.searchDTO.distributionManagers
                        })
                    });

                    if (!response.ok) throw new Error('Network response was not ok');

                    this.results = await response.json();
                } catch (error) {
                    console.error('Error searching ODP:', error);
                    this.validationMessage = 'An error occurred during the search';
                } finally {
                    this.loading = false;
                }
            },
            clearForm() {
                this.searchDTO = {
                    client: null,
                    distributionManagers: [] // Clear selected managers
                };

                this.results = [];
                this.validationMessage = '';
                if (this.getSelectedDistributionManagerIds) {
                    this.initializeDistributionManagerMultiSelect();
                }

                this.$nextTick(() => {
                    const clientInput = document.getElementById('client');
                    if (clientInput) {
                        clientInput.focus();
                    }
                });
            }
        };
    });
});
